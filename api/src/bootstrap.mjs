import { getPreset } from '#config'
import { coreClient } from '#lib/core'
import { attempt } from '#shared/utils'
import { store } from './lib/store.mjs'

/**
 * Generates/Loads the configuration required to start the API
 *
 * @return {bool} true when everything is ok, false if not (API won't start)
 */
export const bootstrapConfiguration = async () => {
  /*
   * Add a getPreset() wrapper that will output debug logs about how presets are resolved
   * This is surprisingly helpful during debugging
   */
  store.getPreset = (key, dflt, opts) => {
    const result = getPreset(key, dflt, opts)
    store.log.debug(`Preset ${key} = ${result}`)

    return result
  }

  /*
   * Now info to store
   */
  if (!store.info)
    store.info = {
      about: 'Morio Management API',
      name: '@morio/api',
      ping: Date.now(),
      start_time: Date.now(),
      version: store.getPreset('MORIO_VERSION'),
    }

  /*
   * Add core client to store
   */
  if (!store.core) store.core = coreClient(`http://core:${store.getPreset('MORIO_CORE_PORT')}`)

  /*
   * Attempt to load the config from CORE
   */
  let config
  const result = await attempt({
    every: 2,
    timeout: 60,
    run: async () => await store.core.get('/config'),
    onFailedAttempt: (s) => store.log.debug(`Waited ${s} seconds for core, will continue waiting.`),
  })
  if (result && Array.isArray(result) && result[0] === 200 && result[1]) {
    config = result[1]
    store.log.debug(`Loaded configuration from core.`)
    /*
     * Also load the info from core
     * This will tell us whether we are running ephemeral or not
     */
    const infoResult = await store.core.get('/info')
    if (infoResult && Array.isArray(infoResult) && infoResult[0] === 200 && infoResult[1]) {
      store.info.production = infoResult[1].production
      store.info.ephemeral = infoResult[1].ephemeral
    }
  } else {
    store.log.warn('Failed to load Morio config from core')
  }
  store.config = config
}
