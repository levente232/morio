import { globDir } from '#shared/fs'
import { validateSettings } from '#lib/validate-settings'
import { keypairAsJwk } from '#shared/crypto'
import { utils } from '../lib/utils.mjs'
import { limits } from '../middleware.mjs'

/**
 * This anonymous controller handles various public endpoints
 *
 * In other words, there's no authentication or RBAC here,
 * all requests are anonymous (hence the name).
 *
 * @returns {object} Controller - The anonymous controller object
 */
export function Controller() {}

/**
 * Gets CA root certificates and fingerprint
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getCaCerts = async function (req, res) {
  const keys = utils.getKeys()

  return keys.rfpr && keys.rcrt && keys.icrt
    ? res.send({
        root_fingerprint: keys.rfpr,
        root_certificate: keys.rcrt,
        intermediate_certificate: keys.icrt,
      })
    : utils.sendErrorResponse(res, `morio.api.info.unavailable`, req.url)
}

/**
 * Gets the client IP to troubleshoot rate limiting
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getClientIp = async function (req, res) {
  return res.send({ ip: req.ip, limits: limits.getKey(req.ip) })
}

/**
 * List downloads
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.listDownloads = async function (req, res) {
  const list = await globDir('/morio/downloads')

  return list
    ? res.send(list.map((file) => file.replace('/morio/downloads', '/downloads')))
    : utils.sendErrorResponse(res, `morio.api.info.unavailable`, req.url)
}

/**
 * Loads the available idenitity/authentication providers (IDPs)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getIdps = async function (req, res) {
  const idps = {}

  /*
   * Add the configured IDPs
   */
  const providers = utils.getSettings('iam.providers', {})
  if (providers) {
    for (const [id, conf] of Object.entries(providers)) {
      let provider = conf.provider
      if (id === 'mrt') provider = 'mrt'
      else if (id === 'local') provider = 'local'
      else if (id === 'apikey') provider = 'apikey'
      if (!utils.getFlag(`DISABLE_IDP_${provider.toUpperCase()}`, false)) {
        idps[id] = {
          id,
          provider,
          label: conf.label,
          about: conf.about || false,
        }
      }
    }
  }

  /*
   * Return the list
   */
  return res.send({ idps, ui: utils.getSettings('iam.ui', {}) })
}

/**
 * This returns the JWKS info, used for Vault integration
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getJwks = async function (req, res) {
  /*
   * Get JWKS info from public key
   */
  const jwks = await keypairAsJwk({ public: utils.getKeys().public })

  return res
    .status(200)
    .send({ keys: [jwks] })
    .end()
}

/**
 * This returns the public key
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getPubkey = async function (req, res, pem = false) {
  return pem
    ? res.type('application/x-pem-file').send(utils.getKeys().public)
    : res.send({ pubkey: utils.getKeys().public })
}

/**
 * Get status
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getStatus = async function (req, res) {
  /*
   * Get the status from core to ensure we have the latest info
   */
  const [status, result] = await utils.coreClient.get(`/status`, false, true)

  if (status !== 200)
    return utils.sendErrorResponse(res, `morio.api.core.status.${status}`, req.url)

  /*
   * Update relevant data
   */
  utils.setEphemeral(result.node?.ephemeral ? true : false)
  utils.setCoreStatus(result)

  /*
   * Now return data
   */
  return res.send({
    info: utils.getInfo(),
    state: {
      ephemeral: utils.isEphemeral(),
      uptime: Math.floor((Date.now() - utils.getStartTime()) / 1000),
      start_time: utils.getStartTime(),
      reload_count: utils.getReloadCount(),
      config_resolved: utils.isConfigResolved(),
      settings_serial: utils.getSettingsSerial(),
      settings_preseeded: utils.getSettings('preseed', false) ? true : false,
    },
    core: utils.getCoreStatus(),
  })
}

/**
 * Validate Morio settings
 *
 * This allows people to validate a settings object prior to applying it.
 * Which should hopefully avoid at least some mistakes.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.validateSettings = async function (req, res) {
  /*
   * Validate request against schema
   */
  const [valid, err] = await utils.validate(`req.setup`, req.body)
  if (!valid) {
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })
  }

  /*
   * Run the settings validation helper, which returns a report object
   */
  const report = await validateSettings(req.body, req.headers)

  return res.send(report).end()
}
