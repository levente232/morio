/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = (store) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = store.inProduction()

  return {
    /**
     * Container configuration
     *
     * @param {object} config - The high-level Morio configuration
     * @return {object} container - The container configuration
     */
    container: {
      // Name to use for the running container
      container_name: 'api',
      // Image to run (different in dev)
      image: PROD ? 'morio/api' : 'morio/api-dev',
      // Image tag (version) to run
      tag: store.getPreset('MORIO_VERSION'),
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: store.getPreset('MORIO_NETWORK'),
      // Volumes
      volumes: PROD ? [
        `${store.getPreset('MORIO_CONFIG_ROOT')}/shared:/etc/morio/shared`,
        `${store.getPreset('MORIO_DATA_ROOT')}/tmp_static:/morio/tmp_static`,
      ] : [
        `${store.getPreset('MORIO_CONFIG_ROOT')}/shared:/etc/morio/shared`,
        `${store.getPreset('MORIO_DATA_ROOT')}/tmp_static:/morio/tmp_static`,
        `${store.getPreset('MORIO_REPO_ROOT')}:/morio`,
      ],
      // Run an init inside the container to forward signals and avoid PID 1
      init: true,
      // Environment
      environment: [
        // Silence this message from the Kafka JS client
        `KAFKAJS_NO_PARTITIONER_WARNING=1`,
      ],
      // Configure Traefik with container labels
      labels: [
        // Tell traefik to watch this container
        'traefik.enable=true',
        // Attach to the morio docker network
        `traefik.docker.network=${store.getPreset('MORIO_NETWORK')}`,
        // Match requests going to the API prefix
        `traefik.http.routers.api.rule=(PathPrefix(\`${store.getPreset('MORIO_API_PREFIX')}\`))`,
        // Set priority to avoid rule conflicts
        `traefik.http.routers.api.priority=100`,
        // Forward to api service
        `traefik.http.routers.api.service=api`,
        // Only match requests on the https endpoint
        `traefik.http.routers.api.entrypoints=https`,
        // Forward to port on container
        `traefik.http.services.api.loadbalancer.server.port=${store.getPreset('MORIO_API_PORT')}`,
        // Enable TLS
        `traefik.http.routers.api.tls=true`,
        // Enable authentication
        `traefik.http.middlewares.auth.forwardauth.address=http://api:${store.getPreset('MORIO_API_PORT')}/auth`,
        `traefik.http.middlewares.auth.forwardauth.authResponseHeadersRegex=^X-Morio-`,
        `traefik.http.routers.api.middlewares=auth@docker`,
      ],
    },
  }
}
