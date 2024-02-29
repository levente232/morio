import { addTraefikTlsConfiguration } from './proxy.mjs'

/**
 * Service object holds the various lifecycle methods
 */
export const service = {
  name: 'api',
  hooks: {
    recreateContainer: () => false,
    restartContainer: () => false,
    preCreate: async (tools) => {
      // Configure TLS
      addTraefikTlsConfiguration(tools.config.services.api, tools)

      return true
    },
  },
}
