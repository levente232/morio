import { Controller } from '#controllers/core'
import { rbac } from '../middleware.mjs'

const Core = new Controller()

// prettier-ignore
/**
 * This method adds the core routes to Express
 *
 * @param {abject} app - The ExpressJS app
 */
export function routes(app) {

  /*
   * API routes to get data from a specific container
   */
  app.get(`/docker/containers/:id`,       rbac.operator, (req, res) => Core.getContainerData(req, res))
  app.get(`/docker/containers/:id/logs`,  rbac.operator, (req, res) => Core.getContainerData(req, res, 'logs'))
  app.get(`/docker/containers/:id/stats`, rbac.operator, (req, res) => Core.getContainerData(req, res, 'stats'))

  /*
   * API routes to get data from a specific image
   */
  app.get(`/docker/images/:id`,           rbac.operator, (req, res) => Core.getDockerImageData(req, res))
  app.get(`/docker/images/:id/history`,   rbac.operator, (req, res) => Core.getDockerImageData(req, res, 'history'))

  /*
   * API routes to get data from a specific network
   */
  app.get(`/docker/networks/:id`, rbac.operator, (req, res) => Core.getDockerNetworkData(req, res))

  /*
   * API routes to make changes to a specific container
   */
  app.put(`/docker/containers/:id/kill`,    rbac.operator, (req, res) => Core.updateContainer(req, res, 'kill'))
  app.put(`/docker/containers/:id/pause`,   rbac.operator, (req, res) => Core.updateContainer(req, res, 'pause'))
  app.put(`/docker/containers/:id/restart`, rbac.operator, (req, res) => Core.updateContainer(req, res, 'restart'))
  app.put(`/docker/containers/:id/start`,   rbac.operator, (req, res) => Core.updateContainer(req, res, 'start'))
  app.put(`/docker/containers/:id/stop`,    rbac.operator, (req, res) => Core.updateContainer(req, res, 'stop'))
  app.put(`/docker/containers/:id/unpause`, rbac.operator, (req, res) => Core.updateContainer(req, res, 'unpause'))

  /*
   * API routes to get data from Docker
   */
  app.get(`/docker/info`,               rbac.operator, (req, res) => Core.getDockerData(req, res, 'info'))
  app.get(`/docker/containers`,         rbac.operator, (req, res) => Core.getDockerData(req, res, 'containers'))
  app.get(`/docker/df`,                 rbac.operator, (req, res) => Core.getDockerData(req, res, 'df'))
  app.get(`/docker/allcontainers`,     rbac.operator, (req, res) => Core.getDockerData(req, res, 'all-containers'))
  app.get(`/docker/images`,             rbac.operator, (req, res) => Core.getDockerData(req, res, 'images'))
  app.get(`/docker/networks`,           rbac.operator, (req, res) => Core.getDockerData(req, res, 'networks'))
  app.get(`/docker/version`,            rbac.operator, (req, res) => Core.getDockerData(req, res, 'version'))

  /*
   * API route for initial setup of a Morio instance
   * Note: This is a public/anonymous route, but will only work in ephemeral state
   */
  app.post(`/setup`, Core.setup)

  /*
   * API route to update (replace) Morio settings
   */
  app.post(`/settings`, rbac.operator, Core.settings)

  /*
   * Create a certificate
   */
  app.post(`/ca/certificate`, rbac.user, Core.createCertificate)

  /*
   * Get the defaults for generating a .deb client package
   */
  app.get(`/pkgs/clients/deb/defaults`, rbac.operator, (req, res) => Core.getClientPackageDefaults(req, res, 'deb'))

  /*
   * Get the defaults for generating a .deb client repo package
   */
  app.get(`/pkgs/repos/deb/defaults`, rbac.operator, (req, res) => Core.getClientRepoPackageDefaults(req, res, 'deb'))

  /*
   * Build a .deb client package
   */
  app.post(`/pkgs/clients/deb/build`, rbac.operator, (req, res) => Core.buildClientPackage(req, res, 'deb'))

  /*
   * Build a .deb client repo package
   */
  app.post(`/pkgs/repos/deb/build`, rbac.operator, (req, res) => Core.buildClientRepoPackage(req, res, 'deb'))

  /*
   * Get the sanitized settings
   */
  app.get(`/settings`, rbac.operator, Core.getSettings)

  /*
   * Hit this route to get the running config
   */
  //app.get(`/config`, rbac.operator, Core.getConfig)

  /*
   * Hit this route to get the running presets
   */
  app.get(`/presets`, rbac.operator, Core.getPresets)

  /*
   * This route is called by core after reconfiguring itself
   */
  app.get(`/reload`, (req, res) => Core.reload(req, res))

  /*
   * This route will cause core to do a soft restart
   */
  app.get(`/restart`, (req, res) => Core.restart(req, res))

  /*
   * This route will cause core to reseed the configuration
   */
  app.get(`/reseed`, (req, res) => Core.reseed(req, res))

  /*
   * This route will export the key data
   * Only root can do this
   */
  app.get(`/export/keys`, rbac.root, (req, res) => Core.exportKeys(req, res))

  /*
   * This route will rotate the Morio Root Token
   * Only operators can do this
   */
  app.post(`/rotate/mrt`, rbac.operator, (req, res) => Core.rotateMrt(req, res))
}
