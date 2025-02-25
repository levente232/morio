// Shared imports
import { testUrl } from '#shared/network'
import { attempt } from '#shared/utils'
import { serviceCodes } from '#shared/errors'
import { serviceOrder, ephemeralServiceOrder, optionalServices } from '#config'
// Core imports
import { ensureMorioNetwork, runHook } from './services/index.mjs'
import { isBrokerLeading } from './services/broker.mjs'
import { log, utils } from './utils.mjs'
import {
  dataWithChecksum,
  validDataWithChecksum,
  loadClusterDataFromDisk,
} from './services/core.mjs'
import { validate } from '#lib/validation'
import { reload } from '../index.mjs'
import { writeJsonFile } from '#shared/fs'

/*
 * Helper method to update the cluster state
 */
export async function updateClusterState(force = false) {
  /*
   * Don't bother in ephemeral mode
   */
  if (utils.isEphemeral()) return

  /*
   * On follower nodes, running this on each heartbeat is ok.
   * But on a leader node, especially on a large cluster, this would scale poorly.
   * So we Debounce this by checking the age of the last time the status was updated
   */
  if (!force && !utils.isStatusStale()) return

  /*
   * Now get to work
   */
  return await forceUpdateClusterState()
}

/**
 * Helper method to update the cluster state
 */
export async function forceUpdateClusterState() {
  await updateNodeState()
  utils.resetClusterStatusAge()
}

/**
 * Helper method to gather the morio cluster state
 */
async function updateNodeState() {
  /*
   * Run heartbeat hook on all services
   */
  const promises = []
  for (const service of utils.isEphemeral() ? ephemeralServiceOrder : serviceOrder) {
    if (optionalServices.includes(service) || (await runHook('wanted', service)))
      promises.push(runHook('heartbeat', service))
  }
  /*
   * Do the same for core as the final service
   */
  promises.push(runHook('heartbeat', 'core'))

  /*
   * Don't consolidate until we have all reasults
   */
  await Promise.all(promises)

  /*
   * If we are leading the cluster,
   * we should also update the consolidated cluster status
   */
  if (utils.isLeading()) consolidateClusterStatus()
}

function consolidateClusterStatus() {
  const status = utils.getStatus()?.nodes?.[utils.getNodeFqdn()]
  let code = 0
  for (const service of [...serviceOrder]) {
    if (typeof status[service] !== 'undefined' && status[service] !== 0) {
      if (code === 0) code = serviceCodes[service]
      log.warn(`[${service}] Service has status code ${status[service]}`)
    }
  }

  utils.setClusterStatus(code, statusColorFromCode(code))
}

function statusColorFromCode(code) {
  if (code === 0) return 'green'
  if (code < 10) return 'amber'
  // TODO: handle more amber states
  return 'red'
}

/**
 * Ensure that the Morio cluster reaches consensus about what config to run
 *
 * Consensus building typically falls apart in 2 main parts:
 *   - Figuring out who is the leader of the cluster
 *   - Figuring out what config to run
 * For the first part, since rqlite uses the RAFT consensus protocol, we do not
 * need to re-implement this. We just make the db service leader the Morio cluster leader
 * because it does not matter who leads, all we need is consensus.
 * Then, there are two options:
 *   - If we are leader, we reach out to all nodes asking them to sync
 *   - If we are not leader, we reach out to the lader asking them to initiate a sync
 */
export async function ensureMorioClusterConsensus() {
  /*
   * Make sure we use the latest cluster state
   */
  await updateClusterState()

  /*
   * Ensure a cluster heartbeat is running
   */
  ensureClusterHeartbeat()
}

/**
 * Ensure a cluster heartbeat
 */
async function ensureClusterHeartbeat() {
  /*
   * If we are leading the cluster, don't bother
   */
  if (utils.isLeading()) return false

  /*
   * Let people know w're staring the heartbeat
   */
  log.debug(`Starting cluster heartbeat`)
  runHeartbeat(true, false)
}

/**
 * Start a cluster heartbeat
 */
export async function runHeartbeat(broadcast = false, justOnce = false) {
  /*
   * Run heartbeats locally if there are no remote nodes
   */
  if (utils.getBrokerCount() === 1 && utils.getFlankingCount() < 1) runLocalHeartbeat()

  /*
   *
   * Ensure we are comparing to up to date cluster state
   * Unless this is the initial setup in which case we just updated the state
   * and should perhaps let the world knoww we just work up
   */
  if (!broadcast) await updateClusterState()

  /*
   * Who are we sending heartbeats to?
   */
  const targets = broadcast ? utils.getNodeFqdns() : [utils.getLeaderFqdn()]

  /*
   * If we are leaderless, targets will hold [false] so guard against that
   * just defer for a while, then try again
   */
  if (targets.length === 1 && targets[0] === false) {
    const delay = 6660
    log.debug(
      `No cluster leader yet. Will wait a while and send out a new broadcast heartbeat in ${Math.floor(delay / 10) / 100} seconds`
    )
    return setTimeout(async () => runHeartbeat(true, false), 3000)
  }

  /*
   * If there are no targets, that might indicate a leader change.
   * We stop the heartbeat, TODO: Can we recover from this?
   */
  if (targets.length === 0) {
    log.info(`No heartbeat targets found. Stopping heartbeat`)
    return
  }

  /*
   * Create a heartbeat for each target
   */
  for (const fqdn of targets.filter((fqdn) => fqdn !== utils.getNodeFqdn())) {
    if (justOnce) sendHeartbeat(fqdn, broadcast, justOnce)
    else {
      /*
       * Do not stack timeouts
       */
      const running = utils.getHeartbeatOut(fqdn)
      if (running) clearTimeout(running)
      /*
       * Store timeout ID so we can cancel it later
       */
      utils.setHeartbeatOut(
        fqdn,
        setTimeout(async () => sendHeartbeat(fqdn, broadcast), heartbeatDelay())
      )
    }
  }
}

/**
 * Start a local heartbeat
 *
 * When Morio has only 1 node. Or when Morio has only 1 broker node,
 * we will run a local heartbeat. This will not reach out over the network
 * but merely trigger the heartbeat lifecycle event locally, as that is what
 * used to keep things up to date.
 *
 * The reason we also run it when there is only 1 broker node is that
 * in a scenario where we have 1 broker node + 1 flanking node, the flanking
 * node going down would mean there is no long a heartbeat, and thus the cluster
 * will start to decay.
 *
 */
export async function runLocalHeartbeat(init = false) {
  /*
   * Ensure we are comparing to up to date cluster state
   */
  if (!init) await updateClusterState()

  /*
   * Do not stack timeouts
   */
  const running = utils.getHeartbeatLocal()
  if (running) clearTimeout(running)
  /*
   * Store timeout ID so we can cancel it later
   */
  utils.setHeartbeatLocal(setTimeout(async () => triggerLocalHeartbeat(), heartbeatDelay()))
}

async function triggerLocalHeartbeat() {
  log.debug(`Running local heartbeat`)
  runLocalHeartbeat(false)
}

async function sendHeartbeat(fqdn, broadcast = false, justOnce = false) {
  /*
   * If fqdn is not a thing, don't bother
   */
  if (!fqdn) {
    log.warn(`Cannot send heartbeat to an FQDN that is falsy`)
    return
  }

  /*
   * Send heartbeat request and verify the result
   */
  const start = Date.now()
  let data
  try {
    if (broadcast) log.trace(`Broadcast heartbeat to ${fqdn}`)
    data = await testUrl(`https://${fqdn}/-/core/cluster/heartbeat`, {
      method: 'POST',
      data: dataWithChecksum({
        from: {
          fqdn: utils.getNodeFqdn(),
          serial: Number(utils.getNodeSerial()),
          uuid: utils.getNodeUuid(),
        },
        to: fqdn,
        cluster: utils.getClusterUuid(),
        cluster_leader: {
          serial: utils.getLeaderSerial() || undefined,
          uuid: utils.getLeaderUuid() || undefined,
        },
        version: utils.getVersion(),
        settings_serial: Number(utils.getSettingsSerial()),
        keys_serial: Number(utils.getKeysSerial()),
        status: utils.getStatus(),
        nodes: utils.getClusterNodes(),
        broadcast,
        uptime: utils.getUptime(),
      }),
      timeout: 1666,
      returnAs: 'json',
      returnError: true,
      ignoreCertificate: true,
    })
  } catch (error) {
    // Help the debug party
    const rtt = Date.now() - start
    log.debug(
      `${broadcast ? 'Broadcast heartbeat' : 'Heartbeat'} to ${fqdn} took ${rtt}ms and resulted in an error.`
    )
    // Verify heartbeat (this will log a warning for the error)
    verifyHeartbeatResponse({ fqdn, error })
    // And trigger a new heartbeat
    runHeartbeat(false, false)
  }

  /*
   * Help the debug party
   */
  const rtt = Date.now() - start
  log.debug(`${broadcast ? 'Broadcast heartbeat' : 'Heartbeat'} to ${fqdn} took ${rtt}ms`)

  /*
   * Verify the response
   */
  verifyHeartbeatResponse({ fqdn, data, rtt })

  /*
   * Trigger a new heatbeat
   */
  if (!justOnce) runHeartbeat(false, false)
}

/*
 * A method to get (and slowly increase) the heartbeat delay
 */
function heartbeatDelay() {
  const now = Number(utils.getHeartbeatInterval())
  const next = Math.ceil(now * 1.5)
  const max = utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL')
  if (next > max) return max * 1000
  else {
    log.debug(`Slowing heartbeat rate from ${now}s to ${next}s interval`)
    utils.setHeartbeatInterval(next)
    return next * 1000
  }
}

/**
 * This verifies a heartbeat response and saves the result
 *
 * Note that this will run on a FOLLOWER node only.
 *
 * @param {string} fqdn - The FQDN of the remote node
 * @param {object} data - The data (body) from the heartbeat response
 * @param {number} rtt - The request's round-trip-time (RTT) in ms
 * @param {object} error - If the request errored out, this will hold the Axios error
 */
function verifyHeartbeatResponse({ fqdn, data, rtt = 0, error = false }) {
  /*
   * Is this an error?
   */
  if (error || data?.code) {
    /*
     * Storing the result of a failed hearbteat will influence the cluster state
     */
    utils.setHeartbeatIn(fqdn, { up: false, ok: false, error: error.code })
    /*
     * Also log something an error-specific message, but not when we're still finding our feet
     */
    if (utils.getUptime() > utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL') * 2) {
      if (error.code === 'ECONNREFUSED') {
        log.warn(`Connection refused when sending heartbeat to ${fqdn}. Is this node up?`)
      } else {
        log.warn(`Unspecified error when sending heartbeat to node ${fqdn}.`)
        if (typeof data === 'object') {
          log.todo(Object.keys(data), 'Data keys in verifyHeartbeatResponse')
          if (data.message) log.todo(data.message)
        }
      }
    }

    return
  } else if (data.status && data.status === 209) {
    /*
     * If the node is busy, we just try again later
     */
  } else if (data.data && data.checksum) {
    if (validDataWithChecksum(data)) data = data.data
    else log.warn(`Heartbeat checksum failure`)
  } else {
    /*
     * It is normal for nodes to not be able to properly sign/checksum the heartbeats
     * when the cluster just came up, since they may not have the required data yet
     * So below 1.5 minute of uptime, let's swallow these warnings
     */
    if (utils.getUptime() > 90) log.warn(`Received an invalid heartbeat response`)
  }

  /*
   * Just because the request didn't error doesn't mean all is ok
   */
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    utils.setHeartbeatIn(fqdn, { up: true, ok: false, data })
    for (const err of data.errors) {
      log.warn(`Irregular heartbeat error from ${fqdn}: ${err}`)
    }
  } else {
    utils.setHeartbeatIn(fqdn, { up: true, ok: true, data })
  }

  /*
   * Warn when things are too slow
   */
  if (rtt && rtt > utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_MAX_RTT')) {
    log.warn(`Heartbeat RTT to ${fqdn} was ${rtt}ms which is above the warning mark`)
  }

  /*
   * Do we need to take any action?
   */
  if (data?.action) {
    if (data.action === 'SYNC') pullClusterData(fqdn)
    else if (data.action === 'INVITE') inviteClusterNode(fqdn)
    else if (data.action === 'LEADER_CHANGE') log.todo('Implement LEADER_CHANGE')
    else log.todo(`Unsupported action in heartbeat response: ${data.action}`)
  } else if (Array.isArray(data?.nodes)) {
    for (const uuid in data.nodes) {
      /*
       * It it's a valid hearbeat, add the node info to the state
       */
      if (uuid !== utils.getNodeUuid()) utils.setClusterNode(uuid, data.nodes[uuid])
    }
  }

  /*
   * Update status of cluster nodes
   */
  if (data?.status?.nodes) {
    for (const fqdn of Object.keys(data.status.nodes)
      .filter((fqdn) => fqdn !== utils.getNodeFqdn())
      .filter((fqdn) => utils.getNodeFqdns().includes(fqdn))) {
      utils.setPeerStatus(fqdn, data.status.nodes[fqdn])
    }
    utils.setClusterStatus(data.status.cluster.code, data.status.cluster.color)
  }
}

export async function verifyHeartbeatRequest(data, type = 'heartbeat') {
  /*
   * Ensure we are comparing to up to date cluster state
   */
  await updateClusterState()

  /*
   * This will hold our findings
   * We end with the most problematic action
   */
  let action = false
  const errors = []

  /*
   * Verify version.
   * If there's a mismatch there is nothing we can do so this is lowest priority.
   */
  if (data.version !== utils.getVersion()) {
    const err = 'VERSION_MISMATCH'
    errors.push(err)
    log.info(`Version mismatch in ${type} from ${data.from.fqdn}: ${err}`)
  }

  /*
   * Verify we know this node
   * If there's a mismatch there is nothing we can do so this is lowest priority.
   */
  if (!utils.getNodeFqdns().includes(data.from.fqdn)) {
    const err = 'ROGUE_CLUSTER_MEMBER'
    errors.push(err)
    log.warn(
      `Rogue cluster member. Received heartbeat from ${data.from.fqdn} which is not a node of this cluster: ${err}`
    )
  }

  /*
   * Verify the 'to' is really us as a mismatch here can indicate fault DNS configuration
   */
  if (utils.getNodeFqdn() !== data.to) {
    const err = 'HEARTBEAT_TARGET_FQDN_MISMATCH'
    errors.push(err)
    log.warn(`Heartbeat target FQDN mismatch. We are not ${data.to}: ${err}`)
  }

  /*
   * Verify settings_serial
   * If there's a mismatch, we need to sync the most recent settings,
   * which are the ones with the highest serial.
   */
  if (data.settings_serial !== utils.getSettingsSerial()) {
    errors.push('SETTINGS_SERIAL_MISMATCH')
    if (Number(data.settings_serial) > Number(utils.getSettingsSerial())) {
      action = 'START_SYNC'
      log.debug(`Settings serial is ahead in ${type} from ${data.from.fqdn}. Will start sync.`)
    } else {
      action = 'SYNC'
      log.debug(`Settings serial is behind in ${type} from ${data.from.fqdn}. Asking to sync.`)
    }
  }

  /*
   * Verify keys_serial
   * If there's a mismatch, ask to re-sync the cluster.
   */
  if (data.keys_serial !== utils.getKeysSerial()) {
    errors.push('KEYS_SERIAL_MISMATCH')
    if (Number(data.keys_serial) > Number(utils.getKeysSerial())) {
      action = 'START_SYNC'
      log.debug(`Keys serial is ahead in ${type} from ${data.from.fqdn}. Will start sync.`)
    } else {
      action = 'SYNC'
      log.debug(`Keys serial is behind in ${type} from ${data.from.fqdn}. Will ask to sync.`)
    }
  }

  /*
   * Verify leader (only for heatbeats)
   * If there's a mismatch, ask to re-elect the cluster leader.
   */
  if (!data.cluster_leader?.serial || data.cluster_leader.serial !== utils.getLeaderSerial()) {
    /*
     * Do they look to us as their leader?
     */
    if (data.cluster_leader?.serial === utils.getNodeSerial()) {
      /*
       * Are they correct
       */
      const leading = await isBrokerLeading()
      if (leading) {
        /*
         * We hereby humbly accept our leading role
         */
        utils.setLeader(utils.getNodeUuid())
        utils.setLeaderSerial(utils.getNodeSerial())
        log.info(`We are now leading this cluster`)
      } else {
        const err = 'LEADER_MISMATCH'
        errors.push(err)
        action = 'LEADER_CHANGE'
        log.info(
          {
            remote_leader: data.cluster_leader?.serial,
            local_leader: utils.getLeaderSerial(),
          },
          `Node ${data.from.fqdn} disagrees about the leader in ${type}: ${err}`
        )
      }
    } else {
      const err = 'LEADER_MISMATCH'
      errors.push(err)
      action = 'LEADER_CHANGE'
      log.info(
        {
          remote_leader: data.cluster_leader?.serial,
          local_leader: utils.getLeaderSerial(),
        },
        `Leader update received from Node ${data.from.fqdn} in ${type}: ${err}`
      )
    }
  }

  /*
   * Verify cluster
   * If there's a mismatch, log an error because we can't fix this without human intervention.
   */
  if (data.cluster !== utils.getClusterUuid()) {
    const err = 'CLUSTER_MISMATCH'
    errors.push(err)
    log.debug(
      { localClusterUuid: utils.getClusterUuid() },
      `Cluster mismatch in ${type} from node ${data.from.fqdn}: ${err}`
    )
  }

  /*
   * It it's a valid hearbeat, add the node info to the state
   */
  if (errors.length === 0) {
    if (data.nodes[data.from.uuid]) utils.setClusterNode(data.from.uuid, data.nodes[data.from.uuid])
  }

  return { action, errors }
}

/**
 * Ensure the Morio cluster is ready
 *
 * This is called from the beforeall lifecycle hook
 * Note that Morio always runs in cluster mode
 * to ensure we can reach flanking nodes whne they are added.
 */
export async function ensureMorioCluster() {
  utils.setCoreReady(false)

  /*
   * Ensure the network exists, and we're attached to it.
   */
  try {
    await ensureMorioNetwork(
      utils.getNetworkName(), // Network name
      'core', // Service name
      {
        Aliases: [
          `${utils.getPreset('MORIO_CONTAINER_PREFIX')}core`,
          `${utils.getPreset('MORIO_CONTAINER_PREFIX')}coredocs`,
          utils.isEphemeral()
            ? `${utils.getPreset('MORIO_CONTAINER_PREFIX')}core_ephemeral`
            : `${utils.getPreset('MORIO_CONTAINER_PREFIX')}core_${utils.getNodeSerial()}`,
        ],
      } // Endpoint config
    )
  } catch (err) {
    log.error(err, 'Failed to ensure morio network configuration')
  }

  /*
   * Morio is always (ready to be) a cluster.
   * This needs to run, regardless of how many nodes we have.
   * Unless of course, we're running in ephemeral mode
   * in which case we can just set the cluster status accordingly
   */
  if (!utils.isEphemeral()) await ensureMorioClusterConsensus()
  else utils.setClusterStatus(1, statusColorFromCode(1))

  /*
   * Is the cluster healthy?
   */
  utils.setCoreReady(true)
}

/*
 * Helpoer method to invite a single node to join the cluster
 *
 * @param {string} fqdn - The fqdn of the remote node
 */
export async function inviteClusterNode(remote) {
  /*
   * First, attempt a single call to join the cluster.
   * We will await this one because typically this works, and it
   * prevents us from having to run this in the background.
   */
  const opportunisticJoin = await inviteClusterNodeAttempt(remote)

  /*
   * If that didn't work, keep trying, but don't block the request
   */
  if (!opportunisticJoin) {
    log.warn(
      `Initial cluster join failed for node ${remote}. Will continue trying, but this is not a good omen.`
    )
    const interval = utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL')
    attempt({
      every: interval,
      timeout: interval * 0.9,
      run: async () => await inviteClusterNodeAttempt(remote),
      onFailedAttempt: (s) =>
        log.debug(`Still waiting for Node ${remote} to join the cluster. It's been ${s} seconds.`),
    }).then(() => log.info(`Node ${remote} has now joined the cluster`))
  } else log.info(`Node ${remote} has joined the cluster`)
}

/**
 * Helper method to attempt inviting a remote cluster node
 *
 * @params {string} remote - The FQDN of the remote node
 */
async function inviteClusterNodeAttempt(remote) {
  log.debug(`Inviting ${remote} to join the cluster`)
  const flanking = utils.isThisAFlankingNode({ fqdn: remote })

  /*
   * Load data from disk becauise what we sync between cluster nodes
   * is what is written to disk.
   */
  const timestamp = utils.getSettingsSerial()
  if (!timestamp)
    log.err(
      'Unable to load timestamp. This is unexpected and may impact cluster formation. Will try anyway.'
    )
  const clusterData = await loadClusterDataFromDisk(timestamp)

  const result = await testUrl(`https://${remote}/-/core/cluster/join`, {
    method: 'POST',
    data: {
      you: remote,
      join: utils.getNodeFqdn(),
      as: flanking ? 'flanking_node' : 'broker_node',
      cluster: utils.getClusterUuid(),
      settings: {
        serial: Number(utils.getSettingsSerial()),
        data: clusterData.settings,
      },
      keys: {
        serial: Number(utils.getKeysSerial()),
        data: clusterData.keys,
      },
    },
    ignoreCertificate: true,
    timeout: Number(utils.getPreset('MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL')) * 900, // *0.9 * 1000 to go from ms to s
    returnAs: 'json',
    returnError: true,
  })

  /*
   * Validate response
   */
  const [valid, err] = await validate(`res.cluster.join`, result)
  if (valid) log.info(`Node ${valid.node} will join the cluster`)
  else log.todo(err, `Handle cluster join failure.`)

  return valid ? true : false
}

export async function pullClusterData(remote) {
  log.debug(`Pulling cluster data from ${remote}`)

  const result = await testUrl(`https://${remote}/-/core/cluster/sync`, {
    method: 'POST',
    data: dataWithChecksum({
      from: {
        fqdn: utils.getNodeFqdn(),
        serial: Number(utils.getNodeSerial()),
        uuid: utils.getNodeUuid(),
        keys_serial: Number(utils.getKeysSerial()),
        settings_serial: Number(utils.getSettingsSerial()),
      },
    }),
    ignoreCertificate: true,
    timeout: 5000,
    returnAs: 'json',
    returnError: true,
  })

  /*
   * Validate response
   */
  const [valid, err] = await validate(`res.cluster.sync`, result)
  if (!valid) log.error(err, `Invalid sync response, discarding update`)
  else {
    log.info(`Updating cluster config from sync result`)
    log.debug(`Writing updated key data to morio.keys`)
    let written = false
    try {
      await writeJsonFile(
        `/etc/morio/keys.${result.data.keys_serial}.json`,
        result.data.keys,
        log,
        0o600
      )
      await writeJsonFile(
        `/etc/morio/settings.${result.data.settings_serial}.json`,
        result.data.settings,
        log,
        0o600
      )
      written = true
    } catch (err) {
      log.error(err, `Failed to write synced data to disk`)
    }

    if (written) reload()
  }
}
