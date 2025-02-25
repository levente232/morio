import { utils, log } from '../utils.mjs'
import { testUrl } from '#shared/network'
import { attempt } from '#shared/utils'

// Default hooks
import { alwaysTrue, defaultRecreateServiceHook, defaultRestartServiceHook } from './index.mjs'

/**
 * Service object holds the various lifecycle methods
 */
export const service = {
  name: 'api',
  hooks: {
    /*
     * Lifecycle hook to determine the service status (runs every heartbeat)
     */
    heartbeat: async () => {
      const up = await isApiUp()
      utils.setServiceStatus('api', up ? 0 : 1)

      return up
    },
    /*
     * Lifecycle hook to determine whether the container is wanted
     * We reuse the alwaysTrue method here, since the api should always be running
     */
    wanted: alwaysTrue,
    /*
     * Lifecycle hook to determine whether to recreate the service
     * We just reuse the default hook here, telling it we need TLS configured.
     */
    recreate: () => defaultRecreateServiceHook('api'),
    /**
     * Lifecycle hook to determine whether to restart the service
     * We just reuse the default hook here, checking whether the service
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('api', hookParams),
  },
}

/**
 * Reach out to the API to reload itself
 *
 * Once core has been reloaded, the API (which is stateless) should
 * reload the data to also reload itself. This message reaches out
 * to the API, asking it to reload itself.
 */
export async function reloadApi() {
  /*
   * Since the API might still be starting up, we'll attempt this until it works
   */
  const up = await attempt({
    every: 5,
    timeout: 60,
    run: async () => await isApiUp(true),
    onFailedAttempt: (s) => log.debug(`Waited ${s} seconds for API, will continue waiting.`),
  })

  if (up) log.debug(`API notified of reload event.`)
  else log.warn(`API did not come up before timeout`)
}

const isApiUp = async (reload = false) => {
  const status = await testUrl(
    `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}api:${utils.getPreset('MORIO_API_PORT')}/${reload ? 'reload' : 'up'}`,
    {
      returnAs: 'status',
    }
  )

  return reload ? status === 204 : status === 200
}
