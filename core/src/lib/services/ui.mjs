import { testUrl } from '#shared/network'
import { utils } from '../utils.mjs'
// Default hooks
import { defaultRecreateServiceHook, defaultRestartServiceHook } from './index.mjs'

/**
 * Service object holds the various lifecycle methods
 */
export const service = {
  name: 'ui',
  hooks: {
    /*
     * Lifecycle hook to determine the service status (runs every heartbeat)
     */
    heartbeat: async () => {
      const result = await testUrl(
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}ui:${utils.getPreset('MORIO_UI_PORT')}/favicon.svg`
      )
      const status = result ? 0 : 1
      utils.setServiceStatus('ui', status)

      return status === 0 ? true : false
    },
    /*
     * Lifecycle hook to determine whether the container is wanted
     * We just reuse the default hook here, checking for ephemeral state
     */
    wanted: () => !utils.getFlag('DISABLE_SERVICE_UI', false),
    /*
     * Lifecycle hook to determine whether to recreate the container
     */
    recreate: () => defaultRecreateServiceHook('ui'),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('ui', hookParams),
  },
}
