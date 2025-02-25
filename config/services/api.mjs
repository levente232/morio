import { generateTraefikConfig, getContainerTagSuffix } from './index.mjs'
import process from 'process'

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()

  /*
   * Grab directories here to keep this DRY
   */
  const DIRS = {
    conf: utils.getPreset('MORIO_CONFIG_ROOT'),
    data: utils.getPreset('MORIO_DATA_ROOT'),
    dl: utils.getPreset('MORIO_DOWNLOADS_FOLDER'),
  }

  /*
   * Traefik (proxy) configuration for the API service
   */
  const traefik = {
    api: generateTraefikConfig(utils, {
      service: 'api',
      prefixes: [utils.getPreset('MORIO_API_PREFIX')],
      priority: 666,
    })
      /*
       * Middleware to rewrite URL to strip prefix used for routing in Traefik
       */
      .set(
        'http.middlewares.api-prefix.replacepathregex.regex',
        `^${utils.getPreset('MORIO_API_PREFIX')}/(.*)`
      )
      .set('http.middlewares.api-prefix.replacepathregex.replacement', '/$1')
      /*
       * Middleware to add Morio service header
       */
      .set(
        'http.middlewares.api-service-header.headers.customRequestHeaders.X-Morio-Service',
        'api'
      )
      /*
       * Middleware for central authentication/access control
       */
      .set(
        'http.middlewares.api-auth.forwardAuth.address',
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}api:${utils.getPreset('MORIO_API_PORT')}/auth`
      )
      .set('http.middlewares.api-auth.forwardAuth.authResponseHeadersRegex', `^X-Morio-`)
      /*
       * Add middleware to router
       * The order in which middleware is loaded matters. Prefix shoud go first, auth last.
       */
      .set('http.routers.api.middlewares', [
        'api-prefix@file',
        'api-service-header@file',
        'api-auth@file',
      ]),
  }

  return {
    /**
     * Container configuration
     */
    container: {
      // Name to use for the running container
      container_name: 'api',
      // Image to run
      image: 'itsmorio/api',
      // Image tag (version) to run
      tag: utils.getPreset('MORIO_VERSION_TAG') + getContainerTagSuffix(utils),
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Volumes
      volumes: PROD
        ? [`${DIRS.conf}/shared:/etc/morio/shared`, `${DIRS.data}/${DIRS.dl}:/morio/downloads`]
        : [
            `${DIRS.conf}/shared:/etc/morio/shared`,
            `${DIRS.data}/${DIRS.dl}:/morio/downloads`,
            `${utils.getPreset('MORIO_GIT_ROOT')}:/morio`,
          ],
      // Run an init inside the container to forward signals and avoid PID 1
      init: true,
      // Environment
      environment: {
        // Silence this message from the Kafka JS client
        KAFKAJS_NO_PARTITIONER_WARNING: 1,
        MORIO_FQDN: process.env['MORIO_FQDN'],
      },
      // Add extra hosts
      hosts: [],
    },
    /*
     * Traefik (proxy) configuration for the API service
     */
    traefik,
  }
}
