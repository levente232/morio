import { getPreset } from 'config/index.mjs'

/*
 * This is hardcoded for now
 */
export const morioConfig = {
  api: getPreset('MORIO_API_PREFIX'),
}

/**
 * Constructor for the Morio API client
 *
 * @constructor
 * @param {headers} object - The headers to handle Morio authentication as retrieved from this hook
 */
export function MorioClient(headers = {}) {
  // Store the headers so users don't have to pass them for each request
  this.headers = headers
  // Helper object that includes JSON content-type headers
  this.jsonHeaders = { ...headers, 'Content-Type': 'application/json' }
}

// API methods /////////////////////////////////////////////////////////////////

/**
 * General purpose method to call the Morio API
 *
 * @param {url} string - The URL to call
 * @param {data} string - The data to send
 * @param {raw} string - Set this to something truthy to not parse the result as JSON
 * @return {response} object - Either the result parse as JSON, the raw result, or false in case of trouble
 */
MorioClient.prototype.call = async function (url, data, raw = false) {
  let response
  try {
    response = await fetch(url, data)
  } catch (err) {
    return [err, false]
  }
  let result = false
  if (response) {
    try {
      result = raw ? await response.text() : await response.json()
    } catch (err) {
      console.log(err)
    }
  }

  return [result, response?.status]
}

/**
 * Gets the certificates
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getCertificates = async function () {
  return await this.call(`${morioConfig.api}/ca/certificates`)
}

/**
 * Gets the public key
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getPublicKey = async function () {
  return await this.call(`${morioConfig.api}/pubkey`)
}

/**
 * Gets the exported key data
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.exportKeys = async function () {
  return await this.call(`${morioConfig.api}/export/keys`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Gets the current configuration
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getCurrentConfig = async function () {
  return await this.call(`${morioConfig.api}/config`)
}

/**
 * Gets the list of authentication providers
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getIdps = async function () {
  return await this.call(`${morioConfig.api}/idps`)
}

/**
 * Gets the current status
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getStatus = async function () {
  return await this.call(`${morioConfig.api}/status`)
}

/**
 * Gets the current settings
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getCurrentSettings = async function () {
  return await this.call(`${morioConfig.api}/settings`)
}

/**
 * Gets the current presets
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getPresets = async function () {
  return await this.call(`${morioConfig.api}/presets`)
}

/**
 * Gets the CA root
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getCaRoot = async function () {
  return await this.call(`${morioConfig.api}/ca/root`)
}

/**
 * Gets defaults for a client package builder
 *
 * @param {string} type - The package type
 * @return {object} - The defaults for this package
 */
MorioClient.prototype.getClientPackageDefaults = async function (type) {
  return await this.call(`${morioConfig.api}/pkgs/clients/${type}/defaults`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Gets defaults for a client repo package builder
 *
 * @param {string} type - The package type
 * @return {object} - The defaults for this package
 */
MorioClient.prototype.getClientRepoPackageDefaults = async function (type) {
  return await this.call(`${morioConfig.api}/pkgs/repos/${type}/defaults`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * List files in the dowbloads folder
 *
 * @return {array} - The list of files
 */
MorioClient.prototype.listDownloads = async function () {
  return await this.call(`${morioConfig.api}/downloads`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * List accounts in Morio
 *
 * @return {array} - The list of files
 */
MorioClient.prototype.getAccounts = async function () {
  return await this.call(`${morioConfig.api}/accounts`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Login
 *
 * @param {string} providerId - ID of the authentication provider
 * @param {object} data - The login data to submit
 * @return {object} - The result
 */
MorioClient.prototype.login = async function (provider, data) {
  return await this.call(`${morioConfig.api}/login`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ provider, data }),
  })
}

/**
 * Create (local) morio account
 *
 * @param {object} data - The data to submit
 * @return {object} - The result
 */
MorioClient.prototype.createAccount = async function (data) {
  return await this.call(`${morioConfig.api}/account`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Create an API key
 *
 * @param {object} data - The data to submit
 * @return {object} - The result
 */
MorioClient.prototype.createApikey = async function (data) {
  return await this.call(`${morioConfig.api}/apikey`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Gets API keys for the current account
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getApikeys = async function () {
  return await this.call(`${morioConfig.api}/apikeys`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Updates an API key
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.updateApikey = async function (id, action) {
  return await this.call(`${morioConfig.api}/apikeys/${id}/${action}`, {
    headers: this.jsonHeaders,
    method: 'PATCH',
  })
}

/**
 * Removes an API key
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeApikey = async function (id) {
  return await this.call(`${morioConfig.api}/apikeys/${id}`, {
    headers: this.jsonHeaders,
    method: 'DELETE',
  })
}

/**
 * Activate a (local) morio account
 *
 * @param {object} data - The data to submit
 * @return {object} - The result
 */
MorioClient.prototype.activateAccount = async function (data) {
  return await this.call(`${morioConfig.api}/activate-account`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Activates MFA on  a (local) morio account
 *
 * @param {object} data - The data to submit
 * @return {object} - The result
 */
MorioClient.prototype.activateMfa = async function (data) {
  return await this.call(`${morioConfig.api}/activate-mfa`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Renew token
 *
 * @param {string} provider - (name of the) authentication provider
 * @param {object} data - The login data to submit
 * @return {object} - The result
 */
MorioClient.prototype.renewToken = async function () {
  return await this.call(`${morioConfig.api}/token`)
}

/**
 * Who am I? A check to get info about the current user.
 *
 * @param {string} provider - (name of the) authentication provider
 * @param {object} data - The login data to submit
 * @return {object} - The result
 */
MorioClient.prototype.whoAmI = async function () {
  return await this.call(`${morioConfig.api}/whoami`)
}

/**
 * Encrypt data
 *
 * @param {string} data - The data to encrypt
 * @return {object} - The result
 */
MorioClient.prototype.encrypt = async function (data) {
  return await this.call(`${morioConfig.api}/encrypt`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ data }),
  })
}

/**
 * Decrypt data
 *
 * @param {string} data - The data to decrypt
 * @return {object} - The result
 */
MorioClient.prototype.decrypt = async function (data) {
  return await this.call(`${morioConfig.api}/decrypt`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Request the build of a client package
 *
 * @param {string} type - The package type
 * @param {object} settings - The build settings
 * @return {object} - The result
 */
MorioClient.prototype.buildClientPackage = async function (type, settings = {}) {
  return await this.call(`${morioConfig.api}/pkgs/clients/${type}/build`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(settings),
  })
}

/**
 * Request the build of a client repo package
 *
 * @param {string} type - The package type
 * @param {object} settings - The build settings
 * @return {object} - The result
 */
MorioClient.prototype.buildClientRepoPackage = async function (type, settings = {}) {
  return await this.call(`${morioConfig.api}/pkgs/repos/${type}/build`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(settings),
  })
}

/**
 * Validates the settings
 *
 * This endpoint does not require authentication
 * @param {object} settings - The settings object to validate
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.validateSettings = async function (settings) {
  return await this.call(`${morioConfig.api}/validate/settings`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(settings),
  })
}

/**
 * Validates the preseed settings
 *
 * This endpoint does not require authentication
 * @param {object} preseed - The preseed object to validate
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.validatePreseed = async function (preseed) {
  return await this.call(`${morioConfig.api}/validate/preseed`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(preseed),
  })
}

/**
 * Validates a Morio node
 *
 * This endpoint does not require authentication
 * @param {object} config - The configuration object to validate
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.validateNode = async function (hostname) {
  return await this.call(`${morioConfig.api}/validate/node`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ hostname }),
  })
}

/**
 * Gets data about a Docker container
 *
 * This endpoint does not require authentication
 * @param {object} config - The configuration object to validate
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.dockerGetContainer = async function (id) {
  return await this.call(`${morioConfig.api}/docker/containers/${id}`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Initial setup
 *
 * This endpoint does not require authentication but only
 * works on an ephemeral node
 * @param {object} settings - The settings to deploy
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.setup = async function (settings) {
  return await this.call(`${morioConfig.api}/setup`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(settings),
  })
}

/**
 * Initial preseed
 *
 * This endpoint does not require authentication but only
 * works on an ephemeral node
 * @param {object} preseed - The preseed settings
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.preseed = async function (preseed) {
  return await this.call(`${morioConfig.api}/preseed`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify(preseed),
  })
}

/**
 * Deploy set of new settings
 *
 * @param {object} settings - The settings to deploy
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.deploy = async function (settings) {
  return await this.call(
    `${morioConfig.api}/settings`,
    {
      headers: this.jsonHeaders,
      method: 'POST',
      body: JSON.stringify(settings),
    },
    true
  )
}

/**
 * Restart Morio
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.restart = async function () {
  return await this.call(`${morioConfig.api}/restart`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Reseed Morio
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.reseed = async function () {
  return await this.call(`${morioConfig.api}/reseed`, {
    headers: this.jsonHeaders,
    method: 'GET',
  })
}

/**
 * Changes a container state
 *
 * @param {string} id - The Docker Container ID
 * @param {string} cmd - The change state command (start, stop, pause, unpause, restart, kill)
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.changeContainerState = async function (id, cmd) {
  return await this.call(
    `${morioConfig.api}/docker/containers/${id}/${cmd}`,
    { method: 'PUT' },
    true
  )
}

/**
 * Starts a Docker container
 *
 * @param {string} id - The Docker Container ID
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.startContainer = async function (id) {
  return await this.changeContainerState(id, 'start')
}

/**
 * Stops a Docker container
 *
 * @param {string} id - The Docker Container ID
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.stopContainer = async function (id) {
  return await this.changeContainerState(id, 'stop')
}

/**
 * Restarts a Docker container
 *
 * @param {string} id - The Docker Container ID
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.restartContainer = async function (id) {
  return await this.changeContainerState(id, 'restart')
}

/**
 * Pauses a Docker container
 *
 * @param {string} id - The Docker Container ID
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.pauseContainer = async function (id) {
  return await this.changeContainerState(id, 'pause')
}

/**
 * Unpauses a Docker container
 *
 * @param {string} id - The Docker Container ID
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.unpauseContainer = async function (id) {
  return await this.changeContainerState(id, 'unpause')
}

/**
 * Kills a Docker container
 *
 * @param {string} id - The Docker Container ID
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.killContainer = async function (id) {
  return await this.changeContainerState(id, 'kill')
}

/**
 * Creates an X.509 certificate
 *
 * @param {object} data - The certificate data
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.createCertificate = async function (data) {
  return await this.call(`${morioConfig.api}/ca/certificate`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ certificate: data }),
  })
}

/**
 * Rotate Morio Root Token
 *
 * @param {string} providerId - ID of the authentication provider
 * @param {object} data - The login data to submit
 * @return {object} - The result
 */
MorioClient.prototype.rotateMrt = async function (mrt) {
  return await this.call(`${morioConfig.api}/rotate/mrt`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ mrt }),
  })
}

/**
 * Get a (single) cache key
 *
 * @param {string} key - The cache key to retrieve
 * @return {object} - The result
 */
MorioClient.prototype.getCacheKey = async function (key) {
  return await this.call(`${morioConfig.api}/cache/keys/${key}`)
}

/**
 * Get a host from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHost = async function (host) {
  return await this.call(`${morioConfig.api}/inventory/hosts/${host}`)
}

/**
 * Get a hostname from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHostname = async function (host) {
  return await this.call(`${morioConfig.api}/inventory/hostnames/${host}`)
}

/**
 * Get all hosts from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHosts = async function () {
  return await this.call(`${morioConfig.api}/inventory/hosts`)
}

/**
 * Get all hosts from the inventory as an object
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryHostsObject = async function () {
  return await this.call(`${morioConfig.api}/inventory/hosts.obj`)
}

/**
 * Get an IP address from the inventory
 *
 * @param {string} - The id of the IP address
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryIp = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/ips/${id}`)
}

/**
 * Get a MAC address from the inventory
 *
 * @param {string} - The id of the MAC address
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryMac = async function (id) {
  return await this.call(`${morioConfig.api}/inventory/macs/${id}`)
}

/**
 * Get all IP addresses from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryIps = async function () {
  return await this.call(`${morioConfig.api}/inventory/ips`)
}

/**
 * Get all MAC addresses from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryMacs = async function () {
  return await this.call(`${morioConfig.api}/inventory/macs`)
}

/**
 * Get all opearting systems from the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryOss = async function () {
  return await this.call(`${morioConfig.api}/inventory/oss`)
}

/**
 * Get stats for the inventory
 *
 * @return {object} - The result
 */
MorioClient.prototype.getInventoryStats = async function () {
  return await this.call(`${morioConfig.api}/inventory/stats`)
}

/**
 * Removes an Host from the inventory
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryHost = async function (id) {
  return await this.call(
    `${morioConfig.api}/inventory/hosts/${id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Removes an IP address
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryIp = async function (id) {
  return await this.call(
    `${morioConfig.api}/inventory/ips/${id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Removes an MAC address
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryMac = async function (id) {
  return await this.call(
    `${morioConfig.api}/inventory/macs/${id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Removes an operating system
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.removeInventoryOs = async function (id) {
  return await this.call(
    `${morioConfig.api}/inventory/oss/${id}`,
    {
      headers: this.jsonHeaders,
      method: 'DELETE',
    },
    true
  )
}

/**
 * Reads a key from the KV store
 *
 * @param {string} key - The key to read
 * @return {string} val - The value under the key (stringified as JSON)
 */
MorioClient.prototype.kvRead = async function (key) {
  return await this.call(`${morioConfig.api}/kv/keys/${key}`)
}

/**
 * Writes a key to the KV store
 *
 * @param {string} key - The key to write to
 * @param {mixed} value - The value to write
 */
MorioClient.prototype.kvWrite = async function (key, value) {
  return await this.call(`${morioConfig.api}/kv/keys/${key}`, {
    headers: this.jsonHeaders,
    method: 'POST',
    body: JSON.stringify({ value }),
  })
}

/**
 * Glob-searches the KV store
 *
 * @param {string} glob - The glob pattern to search
 */
MorioClient.prototype.kvGlob = async function (glob) {
  return await this.call(`${morioConfig.api}/kv/glob/${glob}`)
}

/**
 * Lists all keys in the KV store
 */
MorioClient.prototype.kvList = async function () {
  return await this.call(`${morioConfig.api}/kv/keys`)
}

/**
 * Remove a key from the KV store
 *
 * @param {string} key - The key to remove
 * @param {mixed} value - The value to write
 */
MorioClient.prototype.kvDel = async function (key) {
  return await this.call(`${morioConfig.api}/kv/keys/${key}`, { method: 'DELETE' })
}

/**
 * Gets the tap config from the UI endpoint
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getDynamicTapConfig = async function () {
  return await this.call(`${morioConfig.api}/dconf/tap`)
}

/**
 * Gets the flags config from the UI endpoint
 *
 * @return {object|false} - The API result as parsed JSON or false in case of trouble
 */
MorioClient.prototype.getDynamicFlagsConfig = async function () {
  return await this.call(`${morioConfig.api}/dconf/flags`)
}

/*
 * Don't recreate the client on each call
 */
const api = new MorioClient()

/**
 * The useApi React hook
 */
export function useApi() {
  return { api }
}
