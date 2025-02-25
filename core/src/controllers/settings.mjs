import { resolveHostAsIp } from '#shared/network'
import { writeJsonFile } from '#shared/fs'
import {
  encryptionMethods,
  generateJwtKey,
  generateKeyPair,
  generateGpgKeyPair,
  hash,
  hashPassword,
  uuid,
} from '#shared/crypto'
import { reload } from '../index.mjs'
import { cloneAsPojo } from '#shared/utils'
import { log, utils } from '../lib/utils.mjs'
import { generateCaConfig } from '../lib/services/ca.mjs'
import { unsealKeyData, loadKeysFromDisk, templateSettings } from '../lib/services/core.mjs'
import {
  loadPreseededSettings,
  ensurePreseededContent,
  loadClientModules,
  loadChartProcessors,
  loadStreamProcessors,
} from '#shared/loaders'
import { generateKeySeal, generateRootToken, formatRootTokenResponseData } from '../lib/crypto.mjs'

/**
 * This settings controller handles settings routes
 *
 * @returns {object} Controller - The settings controller object
 */
export function Controller() {}

const ensureTokenSecrecy = (secrets) => {
  for (let [key, val] of Object.entries(secrets)) {
    if (!val?.vault && !utils.isEncrypted(val)) secrets[key] = utils.encrypt(val)
  }

  return secrets
}

/**
 * Deploy new settings
 *
 * This will write the new config to disk and restart Morio
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.deploy = async function (req, res) {
  /*
   * Validate request against schema, but strip headers from body first
   */
  const body = { ...req.body }
  delete body.headers
  const [valid, err] = await utils.validate(`req.settings.deploy`, body)
  if (!valid?.cluster) {
    return utils.sendErrorResponse(res, 'morio.core.schema.violation', req.url, {
      schema_violation: err.message,
    })
  } else log.info(`Processing request to deploy new settings`)

  /*
   * We might need to reseed on reload
   */
  const settings = valid.preseed ? await reseedHandler(valid) : valid

  /*
   * If preseeding failed, back out
   */
  if (!settings) {
    if (valid.preseed) {
      log.warn(`Failed to preseed settings. Backing out of the deploy request.`)
      return utils.sendErrorResponse(res, 'morio.core.settings.preseed.failed', req.url)
    } else {
      log.warn(
        `Settings are not available after preseeding check. Backing out of the deploy request.`
      )
      return utils.sendErrorResponse(res, 'morio.core.deploy.stopped', req.url)
    }
  }

  /*
   * Do the actual deploy
   */
  const result = await deployNewSettings(settings)
  if (!result) return utils.sendErrorResponse(res, 'morio.core.fs.write.failed', req.url)

  /*
   * Don't await reload, just return
   */
  reload({ hotReload: true })

  return res.status(204).send()
}

/**
 * Setup initial settings
 *
 * This will write the new config to disk and restart Morio
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.setup = async function (req, res) {
  /*
   * Only allow this endpoint when running in ephemeral mode
   */
  if (!utils.isEphemeral())
    return utils.sendErrorResponse(res, 'morio.core.ephemeral.required', req.url)

  /*
   * Validate request against schema, but strip headers from body first
   */
  const body = { ...req.body }
  delete body.headers
  const [valid, err] = await utils.validate(`req.settings.deploy`, body)
  if (!valid) {
    return utils.sendErrorResponse(res, 'morio.core.schema.violation', req.url, {
      schema_violation: err.message,
    })
  } else log.info(`Processing request to setup Morio with initial settings`)

  /*
   * Ensure preseeded content
   */
  if (body.preseed) await preseedHandler(body?.preseed, true)

  /*
   * Handle initial setup
   */
  const [data, error] = await initialSetup(req, body)

  /*
   * Send error, or data
   */
  if (data === false && error) return utils.sendErrorResponse(res, error[0], req.url, error?.[1])
  else res.send(data)

  /*
   * Trigger a reload, but don't await it.
   */
  log.info(`Bring Morio out of ephemeral mode`)
  return reload({ initialSetup: true })
}

/**
 * Soft restart core (aka reload)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.restart = async function (req, res) {
  if (utils.getFlag('RESEED_ON_RELOAD')) {
    const currentSettings = utils.getSettings()
    const seededSettings = await reseedHandler(currentSettings)
    if (JSON.stringify(currentSettings) !== JSON.stringify(seededSettings)) {
      /*
       * Settings update, write to disk
       */
      const result = await deployNewSettings(seededSettings)
      if (!result) return utils.sendErrorResponse(res, 'morio.core.fs.write.failed', req.url)
    }
  }

  reload({ restart: true })
  return res.status(204).send()
}

/**
 * Reseed the settings
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.reseed = async function (req, res) {
  const currentSettings = utils.getSettings()
  const seededSettings = await reseedHandler(currentSettings)

  if (JSON.stringify(currentSettings) !== JSON.stringify(seededSettings)) {
    /*
     * Settings update, write to disk
     */
    const result = await deployNewSettings(seededSettings)
    if (!result) return utils.sendErrorResponse(res, 'morio.core.fs.write.failed', req.url)
  }

  /*
   * Don't await reload, just return
   */
  reload({ hotReload: true })

  return res.status(204).send()
}

/**
 * Export the keys
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.exportKeys = async function (req, res) {
  /*
   * Load the raw key data from disk
   */
  const { keys } = await loadKeysFromDisk()

  return res.send({ keys })
}

/**
 * This is a helper method to figure who we are.
 * This is most relevant when we have a cluster.
 *
 * @param {object} body - The request body
 * @return {object} data - Data about this node
 */
const localNodeInfo = async function (body) {
  /*
   * The API injects the headers into the body
   * so we will look at the X-Forwarded-Host header
   * and hope that it matches one of the cluster nodes
   */
  let fqdn = false
  const nodes = (body.cluster?.broker_nodes || []).map((node) => node.toLowerCase())
  for (const header of ['x-forwarded-host', 'host']) {
    const hval = (body.headers?.[header] || '').toLowerCase()
    if (hval && nodes.includes(hval)) fqdn = hval
  }

  /*
   * If we cannot figure it out, return false
   */
  if (!fqdn) return false

  /*
   * Else return uuid, hostname, and IP
   */
  return {
    ...utils.getNode(),
    fqdn,
    hostname: fqdn.split('.')[0],
    ip: await resolveHostAsIp(fqdn),
    serial: nodes.indexOf(fqdn) + 1,
  }
}

const initialSetup = async function (req, settings) {
  /*
   * If settings.preseed.base is set, resolve the settings first
   */
  let valid, err
  if (settings.preseed?.base) {
    /*
     * Load the preseeded settings so we can validate them
     */
    const preseededSettings = await loadPreseededSettings(settings.preseed, settings, log)
    if (!preseededSettings) err = { message: 'Failed to construct settings from preseed data' }
    else [valid, err] = await utils.validate(`req.settings.setup`, preseededSettings)
  } else {
    ;[valid, err] = await utils.validate(`req.settings.setup`, settings)
  }

  if (!valid?.cluster)
    return [
      false,
      ['morio.core.schema.violation', err?.message ? { schema_violation: err.message } : undefined],
    ]

  /*
   * Check whether we can figure out who we are
   * Need to merge the loaded settings with the request headers
   */
  const node = await localNodeInfo({ ...valid, headers: req.body.headers })
  if (!node) {
    log.info(`Ingoring request to setup with unmatched FQDN`)
    return [
      false,
      ['morio.core.schema.violation', err?.message ? { schema_violation: err.message } : undefined],
    ]
  } else log.debug(`Processing request to setup Morio with provided settings`)

  /*
   * Drop us in reload mode
   */
  utils.beginReload()

  /*
   * Generate serial for use in file names
   */
  const serial = Date.now()
  log.debug(`Initial settings will be tracked as: ${serial}`)

  /*
   * This is the initial deploy, generate keys, UUIDS and so on
   */
  const keys = valid.preseed?.keys ? unsealKeyData(valid.preseed.keys) : {}

  /*
   * Generate UUIDs for node and cluster
   */
  log.debug(`Generating UUIIDs`)
  node.uuid = uuid()
  keys.cluster = uuid()
  log.debug(`Node UUID: ${node.uuid}`)
  log.debug(`Cluster UUID: ${keys.cluster}`)

  /*
   * Fenerate the seal secret unless it was provided in the preseeded key data
   */
  if (!keys.seal) keys.seal = await generateKeySeal()

  /*
   * Generate the Morio root token, unless it was provided in the preseeded key data
   */
  let morioRootToken = 'Use the preseeded root token'
  if (!keys.mrt) {
    log.debug(`Generating root token`)
    morioRootToken = await generateRootToken()
    keys.mrt = hashPassword(morioRootToken)
  }

  /*
   * We need a serial for the mrt since it can be rotated
   * By default, we keep it the same as the settings serial
   */
  keys.mrt_serial = serial

  /*
   * Now generate the key pair, unless it was provided in the preseeded key data
   */
  if (!keys.unseal) keys.unseal = hash(keys.seal.salt + keys.seal.hash)
  if (!keys.private) {
    log.debug(`Generating key pairs`)
    const { publicKey, privateKey } = await generateKeyPair(keys.unseal)
    const gpg = await generateGpgKeyPair(keys.cluster)
    keys.public = publicKey
    keys.private = privateKey
    keys.pgpub = gpg.public
    keys.pgpriv = gpg.private
  }

  /*
   * Generate JWT, unles sit was providede in the preseeded key data
   */
  if (!keys.jwt) keys.jwt = generateJwtKey()

  /*
   * Make sure keys & settings exists in memory store so later steps can get them
   */
  utils.setKeys(keys)

  /*
   * Keep preseeded keys out of the settings
   */
  const saveSettings = cloneAsPojo(valid)
  if (typeof saveSettings.preseed?.keys !== 'undefined') delete saveSettings.preseed.keys
  utils.setSettings(saveSettings)

  /*
   * We need to generate the CA config & certificates early so that
   * we can pass them along the join invite to cluster nodes
   */
  await generateCaConfig(keys)

  /*
   * Add encryption methods, unless they are already added
   */
  if (!utils.encrypt) {
    const { encrypt, decrypt, isEncrypted } = encryptionMethods(
      keys.unseal,
      hash(keys.seal.salt + keys.unseal),
      log
    )
    utils.encrypt = encrypt
    utils.decrypt = decrypt
    utils.isEncrypted = isEncrypted
  }

  /*
   * Now ensure token secrecy before we write to disk
   */
  if (saveSettings.tokens?.secrets) {
    saveSettings.tokens.secrets = ensureTokenSecrecy(saveSettings.tokens.secrets)
    utils.setSettings(saveSettings)
  }

  /*
   * Write the settings to disk
   */
  log.debug(`Writing initial settings to settings.${serial}.json`)
  let result = await writeJsonFile(`/etc/morio/settings.${serial}.json`, saveSettings)
  if (!result) return [false, ['morio.core.fs.write.failed']]

  /*
   * Also write the keys to disk
   * Note that we're loading from the store, which was updated by generateCaConfig()
   */
  log.debug(`Writing key data to morio.keys`)
  const keydata = {
    data: await utils.encrypt(utils.getKeys()),
    key: keys.private,
    seal: keys.seal,
  }
  result = await writeJsonFile(`/etc/morio/keys.${serial}.json`, keydata, log, 0o600)
  if (!result) return [false, ['morio.core.fs.write.failed']]

  /*
   * Write the node info to disk
   */
  log.debug(`Writing node data to node.json`)
  result = await writeJsonFile(`/etc/morio/node.json`, node)
  if (!result) return [false, ['morio.core.fs.write.failed']]

  /*
   * The data to return
   */
  return [
    {
      result: 'success',
      uuids: {
        node: node.uuid,
        cluster: keys.cluster,
      },
      root_token: morioRootToken.includes('preseeded')
        ? {
            about:
              'This Morio instance was preseeded with Key Data. No new Morio root token was generated. Use the preceeded root token instead.',
            value: morioRootToken,
          }
        : formatRootTokenResponseData(morioRootToken),
    },
    false,
  ]
}

const deployNewSettings = async function (settings) {
  /*
   * Generate serial for use in file names
   */
  const serial = Date.now()
  log.info(`New settings will be tracked as: ${serial}`)

  /*
   * Handle secrets
   */
  if (settings.tokens?.secrets)
    settings.tokens.secrets = ensureTokenSecrecy(settings.tokens.secrets)

  /*
   * Write the protected settings to disk
   */
  log.debug(`Writing new settings to settings.${serial}.json`)
  const result = await writeJsonFile(`/etc/morio/settings.${serial}.json`, settings)

  return result
}

const preseedHandler = async function (preseedSettings = false, force = false) {
  if (!preseedSettings) preseedSettings = utils.getSettings('preseed', false)
  if (preseedSettings && preseedSettings.git) {
    if (force || (utils.getFlag('RESEED_ON_RELOAD', false) && preseedSettings.git))
      await ensurePreseededContent(preseedSettings, log)
  }
}

const reseedHandler = async function (newSettings = false) {
  if (!newSettings) return newSettings

  /*
   * If the preseed settings have tokens in them we need to resolve them.
   * In addition, we have the extra difficulty that tokens can be part
   * of the current settings, or the new settings. So, we load the current,
   * then the new settings, so that the new settings take precedence.
   */
  const tokens = {
    ...utils.getSettings('tokens.vars', {}),
    ...(newSettings.tokens?.vars || {}),
  }
  for (const [key, val] of Object.entries({
    ...utils.getSettings('tokens.secrets', {}),
    ...(newSettings.tokens?.secrets || {}),
  }))
    tokens[key] = await utils.unwrapSecret(key, val)

  /*
   * New template the settings
   */
  const templatedSettings = await templateSettings(newSettings)

  /*
   * Load the preseeded settings
   */
  let settings = await loadPreseededSettings(
    templatedSettings.preseed ? templatedSettings.preseed : utils.getSettings('preseed'),
    templatedSettings ? templatedSettings : utils.getSettings(),
    log
  )

  /*
   * Ensure preseeded chart processors are in place
   */
  await ensureChartProcessors(settings)

  /*
   * Ensure preseeded client module are in place
   */
  await ensureClientModules(settings)

  /*
   * Ensure preseeded stream processors are in place
   */
  settings = await ensureStreamProcessors(settings)

  return settings
}

/**
 * This distributes the client modules that are preseeded
 *
 * @param {object} settings - The settings to use (could be different from the running settings)
 * @return {object} settings - The (potentially) updated settings
 */
export async function ensureClientModules(settings) {
  return await loadClientModules(settings, log)
}

/**
 * This distributes the chart processors that are preseeded
 *
 * @param {object} settings - The settings to use (could be different from the running settings)
 */
export function ensureChartProcessors(settings) {
  loadChartProcessors(settings, log)
}

/**
 * This distributes the stream processors that are preseeded
 *
 * @param {object} settings - The current settings
 * @return {object} settings - The (potentially) updated settings
 */
export async function ensureStreamProcessors(settings) {
  /*
   * This will not only load stream processors, but also
   * merge their (default) settings into  the settings object
   */
  settings = await loadStreamProcessors(settings, log)

  return settings
}
