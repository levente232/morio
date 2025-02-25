import { Store, unshift } from '#shared/store'
import { logger } from '#shared/logger'
import { getPreset, inProduction } from '#config'
import { errors } from '../errors.mjs'
import { validate as validateMethod } from '../schema.mjs'
import { restClient } from '#shared/network'
import { db } from './db.mjs'
import { kv as kvClient } from '#shared/kv'

/*
 * Export a log object for logging via the logger
 */
export const log = logger(getPreset('MORIO_API_LOG_LEVEL'), 'api')

/*
 * Add a todo log method to make it easy to spot things still to be done
 */
log.todo = (a, b) => {
  const location = new Error().stack.split('\n')[2]

  return typeof a === 'object'
    ? log.debug(a, `🟠 ${b}${location}`)
    : log.debug(`🟠 ${a}${location}`)
}

/*
 * This store instance will hold our state, but won't be exported.
 * Only through the utility methods below will we allow changing state.
 * We're also initializing it with some data at start time.
 */
const store = new Store(log)
  .set('state.start_time', Date.now())
  .set('state.reload_count', 0)
  .set('prefix', getPreset('MORIO_API_PREFIX'))
  .set('info', {
    about: 'Morio Management API',
    channel: getPreset('MORIO_RELEASE_CHANNEL'),
    name: '@itsmorio/api',
    production: inProduction(),
    version: getPreset('MORIO_CONTAINER_TAG'),
  })

/*
 * Export an utils instance to hold utility methods
 */
export const utils = new Store(log)

/*
 * Attach kv helper
 */
utils.kv = kvClient(db, log)

/*           _   _
 *  __ _ ___| |_| |_ ___ _ _ ___
 * / _` / -_)  _|  _/ -_) '_(_-<
 * \__, \___|\__|\__\___|_| /__/
 * |___/
 * Methods to get data from the store (aka state)
 */

/**
 * Helper method to get the broker count
 *
 * @return {number} count - The number of broker nodes
 */
utils.getBrokerCount = () => utils.getSettings('cluster.broker_nodes', []).length

/**
 * Helper method to get a list of all FQDNS for broker nodes
 *
 * @return {array} list - The list of all broker node FQDNs
 *
 */
utils.getBrokerFqdns = () => utils.getSettings('cluster.broker_nodes', [])

/**
 * Helper method to get the cluster Fqdn
 *
 * @return {string} fqdn - The cluster's FQDN
 */
utils.getClusterFqdn = () => {
  const nodes = utils.getBrokerCount()

  return nodes > 1
    ? utils.getSettings('cluster.fqdn')
    : utils.getSettings(['cluster', 'broker_nodes', 0])
}

/**
 * Helper method to get the cluster UUID
 *
 * @return {string} uuid - The cluster's uuid
 */
utils.getClusterUuid = () => store.get('state.cluster.uuid')

/**
 * Helper method to get the core status
 *
 * @return {object} state - The core status
 */
utils.getCoreStatus = () => store.get('status.core')

/**
 * Helper method to get a flag from the settings
 *
 * @param {string} flag - The flag name to retrieve
 * @return {mixed} data - Whatever is stored under the flag
 */
utils.getFlag = (flag) => store.get(['settings', 'resolved', 'tokens', 'flags', flag], false)

/**
 * Helper method to get the info from the store
 *
 * @return {string} prefix - The API prefix
 */
utils.getInfo = () => store.get('info')

/**
 * Helper method to het the keys
 *
 * @return {object} keys - The keys data
 */
utils.getKeys = () => store.get('keys')

/**
 * Helper method to get the FQDN of the local node
 *
 * @return {string} fqdn - The local node's FQDN
 */
utils.getNodeFqdn = () => store.get('state.node.fqdn', false)

/**
 * Helper method to get the node_serial of the local node
 *
 * @return {number} node_serial - The local node's serial
 */
utils.getNodeSerial = () => store.get('state.node.serial', false)

/**
 * Helper method to get the node UUID
 *
 * @return {string} uuid - The local node's uuid
 */
utils.getNodeUuid = () => store.get('state.node.uuid')

/**
 * Helper method to get an OIDC client for a given OIDC identity provider ID
 *
 * @param {string} id - The id of the oidc identity provider
 * @returnb {object|bool} client - The client if found, or fase when not
 */
utils.getOidcClient = (id) => store.get(['oidc', 'clients', id], false)

/**
 * Helper method to get an OIDC PKCE data
 *
 * @param {string} id - The id of the oidc identity provider
 * @returnb {object|bool} client - The client if found, or fase when not
 */
utils.getOidcPkce = (id, state) => store.get(['oidc', 'pkce', id, state], false)

/**
 * Helper method to get the API prefix
 *
 * @return {string} prefix - The API prefix
 */
utils.getPrefix = () => getPreset('MORIO_API_PREFIX')

/**
 * Helper method to get a preset
 *
 * This wraps getPreset() to output trace logs about how presets are resolved
 * This is surprisingly helpful during debugging
 *
 * @param {string} key - Name of the environment variable (or default) to return
 * @param {string} dflt - The fallback value to use (default)
 * @param {object} opts - An object to further control how this method behaves
 * @param {mixed} opts.dflt - Optional fallback/default for the requested key if the value is not set in env or presets
 * @param {string} opts.as - Optional type to cast the result to. One of bool, string, or number
 * @param {object} opts.alt - Optional object holding key/values that will be used as fallback/default if key is not set in env or presets. Takes precedence over opts.dflt
 * @param {object} opts.force - Optional object holding key/values that will override what is stored in env or presets
 * @return {mixed} value - The value in the environment variable of default
 */
utils.getPreset = (key, dflt, opts) => {
  const result = getPreset(key, dflt, opts)
  log.trace(`Preset ${key} = ${result}`)

  return result
}

/**
 * Helper method to get all presets
 */
utils.getPresets = () => store.get('presets', {})

/**
 * Helper method to get the provider IDs
 *
 * @return {array} ids - The list of provider IDs
 */
utils.getProviderIds = () => Object.keys(utils.getSettings('iam.providers', {}))

/**
 * Helper method to get the reload_count
 *
 * @return {number} time - The reload_count value
 */
utils.getReloadCount = () => store.get('state.reload_count')

/**
 * Helper method to get the sanitized settings
 *
 * Node that unlike getSettings, this always returns the entire object
 * as it's only used in the route to provide this object to the API
 *
 * @return {object} settings - The sanitized settings object
 */
utils.getSanitizedSettings = () => store.get('settings.sanitized')

/**
 * Helper method to facilitate getting resolved settings
 *
 * Note that not providing a dflt fallback value will log a WARN message
 * So if you are not sure whether the value is there, provide a fallback, even if it's false
 *
 * @param {string|array} path - Path to the key in settings, as an array or dot.notation.triung
 * @param {mixed} dflt - A default value to return if none is found
 * @return {mixed} data - The requested settings data
 */
utils.getSettings = (path, dflt) =>
  path === undefined
    ? store.get('settings.resolved', dflt)
    : store.get(unshift(['settings', 'resolved'], path), dflt)

/**
 * Helper method to get the settings_serial
 *
 * @return {number} data - The settings_serial
 */
utils.getSettingsSerial = () => store.get('state.settings_serial', 0)

/**
 * Helper method to get the start_time
 *
 * @return {number} time - The start_time timestamp
 */
utils.getStartTime = () => store.get('state.start_time')

/*          _   _
 *  ___ ___| |_| |_ ___ _ _ ___
 * (_-</ -_)  _|  _/ -_) '_(_-<
 * /__/\___|\__|\__\___|_| /__/
 * Methods to set/save data in/to the store (aka state)
 */

/**
 * Helper method to store the cluster UUID
 *
 * @param {string} uuid - The clusters's uuid
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setClusterUuid = (uuid) => {
  store.set('state.cluster.uuid', uuid)
  return utils
}

/**
 * Helper method to store the core status
 *
 * @param {object} coreState - The core state
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setCoreStatus = (coreStatus) => {
  store.set('status.core', coreStatus)
  return utils
}

/**
 * Helper method to store the epehemral state value
 *
 * @param {bool} val - Truthy or falsy value to detemine the ephemeral state
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setEphemeral = (val) => {
  store.set('state.ephemeral', val ? true : false)
  return utils
}

/**
 * Helper method to store the keus
 *
 * @param {object} config - The keys object
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setKeys = (keys) => {
  store.set('keys', keys)
  return utils
}

/**
 * Helper method to store a new Morio Root Token
 *
 * @param {string} mrtHash - The password hash of the new Morio root token
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setKeysMrt = (mrtHash) => {
  store.set('keys.mrt', mrtHash)
  return utils
}

/**
 * Helper method to store the node FQDN
 *
 * @param {string} fadn - The node's FQDN
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setNodeFqdn = (fqdn) => {
  store.set('state.node.fqdn', fqdn)
  return utils
}

/**
 * Helper method to store the node serial
 *
 * @param {number} serial - The node's serial
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setNodeSerial = (serial) => {
  store.set('state.node.serial', serial)
  return utils
}

/**
 * Helper method to store the node UUID
 *
 * @param {string} uuid - The node's uuid
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setNodeUuid = (uuid) => {
  store.set('state.node.uuid', uuid)
  return utils
}

/**
 * Helper method to store OIDC clients
 *
 * @param {string} id - The id of the OIDC identity provider
 * @param {string} state - The state parameter in the OIDC flow
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setOidcPkce = (id, state, data) => {
  store.set(['oidc', 'pkce', id, state], data)
  return utils
}

/**
 * Helper method to store OIDC clients
 *
 * @param {string} id - The id of the OIDC identity provider
 * @param {object} client - The OIDC cient
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setOidcClient = (id, client) => {
  store.set(['oidc', 'clients', id], client)
  return utils
}

/**
 * Helper method to store the presets
 *
 * @param {object} presets - The presets
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setPresets = (presets) => {
  store.set('presets', presets)
  return utils
}

/**
 * Helper method to store the settings_serial
 *
 * @param {number} serial - The settings_serial
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setSettingsSerial = (settings_serial) => {
  store.set('state.settings_serial', settings_serial)
  return utils
}

/**
 * Helper method to store the sanitized settings
 *
 * @param {object} settings - The sanitized settings
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setSanitizedSettings = (sanitized_settings) => {
  store.set('settings.sanitized', sanitized_settings)
  return utils
}

/**
 * Helper method to store the settings
 *
 * @param {object} settings - The settings
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.setSettings = (settings) => {
  store.set('settings.resolved', settings)
  return utils
}

/*     _           _
 *  __| |_  ___ __| |__ ___
 * / _| ' \/ -_) _| / /(_-<
 * \__|_||_\___\__|_\_\/__/
 * Checks for things, returns true or false only
 */

/**
 * Helper method to see whether the config is resolved
 *
 * @return {bool} resolved - True if the config is resolved, false if not
 */
utils.isConfigResolved = () => (store.get('state.config_resolved') ? true : false)

/**
 * Helper method for returning ephemeral state
 *
 * @return {bool} ephemeral - True if ephemeral, false if not
 */
utils.isEphemeral = () => (store.get('state.ephemeral', false) ? true : false)

/**
 * Helper method for returning reloading state
 *
 * @return {bool} reloading - True if reloading, false if not
 */
utils.isReloading = () => (store.get('state.reloading', false) ? true : false)

/*  _                     __
 * | |_ _ _ __ _ _ _  ___/ _|___ _ _ _ __  ___ _ _ ___
 * |  _| '_/ _` | ' \(_-<  _/ _ \ '_| '  \/ -_) '_(_-<
 *  \__|_| \__,_|_||_/__/_| \___/_| |_|_|_\___|_| /__/
 * Mutate data in the store/state
 */

/**
 * Helper method to mark the start of a reload
 *
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.beginReload = () => {
  log.debug('Resolving Morio Configuration')
  store.set('state.config_resolved', false)
  store.set('state.reloading', true)
  return utils
}

/**
 * Helper method to mark the start of a reload
 *
 * @return {object} utils - The utils instance, making this method chainable
 */
utils.endReload = () => {
  store.set('state.config_resolved', true)
  store.set('state.reload_count', Number(store.get('state.reload_count')) + 1)
  store.set('state.reload_time', Date.now())
  store.set('state.reloading', false)
  const serial = store.get('state.settings_serial', false)
  log.info(`Morio API Ready - Configuration Resolved - Settings: ${serial ? serial : 'Ephemeral'}`)
  return utils
}

/*      _   _
 *  ___| |_| |_  ___ _ _
 * / _ \  _| ' \/ -_) '_|
 * \___/\__|_||_\___|_|
 * Utility methods that do not use store data or presets
 */

/**
 * Clear OIDC PKCE data after an OIDC flow
 */
utils.clearOidcPkce = (id, state) => store.unset(['oidc', 'pkce', id, state])

/**
 * Returns a pre-configured API client, itself on object
 */
utils.coreClient = restClient(
  `http://${getPreset('MORIO_CONTAINER_PREFIX')}core:${getPreset('MORIO_CORE_PORT')}`
)

/**
 * Add helper method for sending RFC7807 error responses
 *
 * @param {object} res - The response object from Express
 * @param {string|object} tempalte - Either a string for a know tempate, or a customg object holding the response data
 * @param {bool|string} route - The API route to construct the instance string, or false if there is none
 */
utils.sendErrorResponse = (res, template, url = false, extraData = {}) => {
  let data = {}
  /*
   * Allow passing in an error template name
   */
  if (typeof template === 'string') {
    if (errors[template])
      data = { ...errors[template], type: utils.getPreset('MORIO_ERRORS_WEB_PREFIX') + template }
    else {
      store.log.error(
        `The sendErrorResponse method was called with a template string that is not a known error template: ${template}`
      )
      return res.status(500).send().end()
    }
  }

  /*
   * Add the instance
   */
  data.instance =
    `http://${getPreset('MORIO_CONTAINER_PREFIX')}api:${utils.getPreset('MORIO_API_PORT')}` +
    (data.route ? data.route : url ? url : '')

  return res
    .type('application/problem+json')
    .status(data.status)
    .send({ ...data, ...extraData })
    .end()
}

/**
 * Add validate method for eacy access
 */
utils.validate = validateMethod
