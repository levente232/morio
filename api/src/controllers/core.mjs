import { validateSettings } from '#lib/validate-settings'
import { utils, log } from '../lib/utils.mjs'
import { reload } from '../index.mjs'
import { loadPreseededSettings } from '#shared/loaders'
import { hashPassword } from '#shared/crypto'

/**
 * This core controller provides access to morio core
 *
 * @returns {object} Controller - The core controller object
 */
export function Controller() {}

/**
 * Gets Docker data from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} path - The core api path
 */
Controller.prototype.getDockerData = async function (req, res, path) {
  const [status, result] = await utils.coreClient.get(`/docker/${path}`)

  return res.status(status).send(result)
}

/**
 * Gets container data from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} path - The core api path
 */
Controller.prototype.getContainerData = async function (req, res, path = false) {
  const [status, result] = await utils.coreClient.get(
    `/docker/containers/${req.params.id}${path ? '/' + path : ''}`
  )

  return res.status(status).send(result)
}

/**
 * Updates container data via core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} path - The core api path
 */
Controller.prototype.updateContainer = async function (req, res, path) {
  const [status, result] = await utils.coreClient.put(`/docker/containers/${req.params.id}/${path}`)

  return res.status(status).send(result)
}

/**
 * Creates Docker resource via core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} path - The core api path
 */
Controller.prototype.createDockerResource = async function (req, res, path) {
  const [status, result] = await utils.coreClient.post(`/docker/${path}`, bodyPlusHeaders(req))

  return res.status(status).send(result)
}

/**
 * Creates a certificate (passed to core which gets it from the CA)
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.createCertificate = async function (req, res) {
  /*
   * Since we use mTLS on Kafka, we need to prevent people from generating
   * a certificate that will give them superpowers (unless they are engineer or root)
   */
  const suffix = `${utils.getClusterUuid()}.morio.internal`
  if (
    !['engineer', 'root'].includes(req.headers['x-morio-role']) &&
    (req.body.certificate.cn === `root.${suffix}` ||
      req.body.certificate.cn.includes(`infra.${suffix}`))
  ) {
    return utils.sendErrorResponse(res, 'morio.api.rbac.denied', req.url)
  }

  /*
   * Now pass it on to core
   */
  const [status, result] = await utils.coreClient.post(`/ca/certificate`, bodyPlusHeaders(req))

  return res.status(status).send(result)
}

/**
 * Gets docker image data from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} path - The core api path
 */
Controller.prototype.getDockerImageData = async function (req, res, path = false) {
  const [status, result] = await utils.coreClient.get(
    `/docker/images/${req.params.id}${path ? '/' + path : ''}`
  )

  return res.status(status).send(result)
}

/**
 * Gets Docker network data from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} path - The core api path
 */
Controller.prototype.getDockerNetworkData = async function (req, res, path = false) {
  const [status, result] = await utils.coreClient.get(
    `/docker/networks/${req.params.id}${path ? '/' + path : ''}`
  )

  return res.status(status).send(result)
}

/**
 * Handles the initial setup
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.setup = async function (req, res) {
  /*
   * This route is only accessible when running in ephemeral mode
   */
  if (!utils.isEphemeral())
    return utils.sendErrorResponse(res, 'morio.api.ephemeral.required', req.url)

  /*
   * Validate request against schema, but strip headers from body first
   */
  const body = { ...req.body }
  delete body.headers

  /*
   * If preseed.base is set, resolve the settings first
   */
  let valid, err
  if (body.preseed?.base) {
    /*
     * Load the preseeded settings so we can validate them
     */
    const settings = await loadPreseededSettings(body.preseed, false, log, '/tmp')
    if (!settings) err = { message: 'Failed to construct settings from preseed data' }
    else [valid, err] = await utils.validate(`req.setup`, settings)
  } else {
    ;[valid, err] = await utils.validate(`req.setup`, body)
  }

  if (!valid) {
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })
  }

  /*
   * Validate settings are deployable
   */
  const report = await validateSettings(valid)

  /*
   * Make sure setting are valid
   */
  if (!report.valid)
    return utils.sendErrorResponse(
      res,
      'morio.api.settings.invalid',
      req.url,
      report.errors ? { validation_errors: report.errors } : false
    )

  /*
   * Make sure settings are deployable
   */
  if (!report.deployable)
    return utils.sendErrorResponse(res, 'morio.api.settings.undeployable', req.url)

  /*
   * Settings are valid and deployable, pass them to core
   */
  const [status, result] = await utils.coreClient.post(`/setup`, bodyPlusHeaders(req))

  return res.status(status).send(result)
}

/**
 * Deploys new settings
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.settings = async function (req, res) {
  /*
   * This route is not accessible when running in ephemeral mode
   */
  if (utils.isEphemeral())
    return res.status(400).send({
      errors: ['You can not use this endpoint on an ephemeral Morio node'],
    })

  /*
   * Validate settings
   */
  const report = await validateSettings(req.body)

  /*
   * Make sure setting are valid
   */
  if (!report.valid) return res.status(400).send({ errors: ['Settings are not valid'], report })

  /*
   * Make sure settings are deployable
   */
  if (!report.deployable)
    return res.status(400).send({ errors: ['Settings are not deployable'], report })

  /*
   * Settings are valid and deployable, pass them to core
   */
  const [status, result] = await utils.coreClient.post(`/settings`, bodyPlusHeaders(req))

  return res.status(status).send(result)
}

/**
 * Export keys
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.exportKeys = async function (req, res) {
  /*
   * Pass request to core
   */
  const [status, result] = await utils.coreClient.get(`/export/keys`)

  return res.status(status).send(result)
}
/**
 * Stream service logs
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.streamServiceLogs = async function (req, res) {
  return await utils.coreClient.streamGet(`/logs/${req.params.service}`, res)
}

/**
 * Loads defaults for client packages from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} type - The type of client package (one of deb, rpm, msi, or pkg)
 */
Controller.prototype.getClientPackageDefaults = async function (req, res, type) {
  const [status, result] = await utils.coreClient.get(`/pkgs/clients/${type}/defaults`)

  return res.status(status).send(result)
}

/**
 * Loads defaults for client repo packages from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} type - The type of client package (one of deb, rpm, msi, or pkg)
 */
Controller.prototype.getClientRepoPackageDefaults = async function (req, res, type) {
  const [status, result] = await utils.coreClient.get(`/pkgs/repos/${type}/defaults`)

  return res.status(status).send(result)
}

/**
 * Loads the current (sanitized) settings
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getSettings = async function (req, res) {
  return res.send(utils.getSanitizedSettings())
}

/**
 * Loads the current presets from core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.getPresets = async function (req, res) {
  return res.send(utils.getPresets())
}

/**
 * Submits a build request for a client package to core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} type - The type of client package (one of deb, rpm, msi, or pkg)
 */
Controller.prototype.buildClientPackage = async function (req, res, type) {
  const [status, result] = await utils.coreClient.post(
    `/pkgs/clients/${type}/build`,
    bodyPlusHeaders(req)
  )

  return res.status(status).send(result)
}

/**
 * Submits a build request for a client repo package to core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 * @param {string} type - The type of client package (one of deb, rpm, msi, or pkg)
 */
Controller.prototype.buildClientRepoPackage = async function (req, res, type) {
  const [status, result] = await utils.coreClient.post(
    `/pkgs/repos/${type}/build`,
    bodyPlusHeaders(req)
  )

  return res.status(status).send(result)
}

/**
 * Request to join a cluster
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.joinCluster = async function (req, res) {
  log.info('Received request to join cluster')
  const [status, result] = await utils.coreClient.post(`/cluster/join`, bodyPlusHeaders(req))

  return res.status(status).send(result)
}

/**
 * Reload
 *
 * This route is called from core, it triggers a reload of the config
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.reload = async function (req, res) {
  /*
   * We will not wait for the reload event here as doing so can
   * introduce a deadlock where core is waiting for the response to
   * this request, while api (inside reload) is trying to load the
   * data from core. Since NodeJS is single-threaded, this will
   * de-facto be a deadlock.
   */
  log.debug('Received reload signal from core')
  res.status(204).send()

  /*
   * Reload, but don't wait for it.
   */
  return reload()
}

/**
 * (soft) restart core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.restart = async function (req, res) {
  log.info('Received request to do a soft restart')
  const [status, result] = await utils.coreClient.get(`/restart`)

  return res.status(status).send(result)
}

/**
 * Reseed core
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.reseed = async function (req, res) {
  /*
   * Load the preseeded settings so we can validate them
   */
  const settings = await loadPreseededSettings(
    utils.getSettings('preseed'),
    utils.getSettings(),
    log,
    '/tmp'
  )

  /*
   * Validate settings against the schema
   */
  const [validSettings, errSettings] = await utils.validate(`req.setup`, settings)
  if (!validSettings) {
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: errSettings.message,
    })
  }

  /*
   * Validate settings are deployable
   */
  const report = await validateSettings(settings)

  /*
   * Make sure setting are valid
   */
  if (!report.valid)
    return utils.sendErrorResponse(
      res,
      'morio.api.settings.invalid',
      req.url,
      report.errors ? { validation_errors: report.errors } : false
    )

  /*
   * Make sure settings are deployable
   */
  if (!report.deployable)
    return utils.sendErrorResponse(res, 'morio.api.settings.undeployable', req.url)

  /*
   * Pass the request to core
   */
  const [status, result] = await utils.coreClient.get(`/reseed`)

  return res.status(status).send(result)
}

/**
 * Rotate Morio Root Token
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.rotateMrt = async function (req, res) {
  /*
   * Validate settings against the schema
   */
  const [valid, err] = await utils.validate(`req.rotate.mrt`, req.body)
  if (!valid) {
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })
  }

  /*
   * Pass the request to core
   */
  const [status, result] = await utils.coreClient.post(`/rotate/mrt`, valid)

  /*
   * If a new root token was generated, also store its hashed version in memory
   * since we need it for the MRT identity provider
   */
  if (status === 200 && result?.root_token?.value) {
    utils.setKeysMrt(hashPassword(result.root_token.value))
    return res.send(result)
  }

  return utils.sendErrorResponse(res, 'morio.api.settings.undeployable', req.url)
}

const bodyPlusHeaders = (req) => ({ ...req.body, headers: req.headers })
