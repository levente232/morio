import { mkdir } from '#shared/fs'
import { restClient, testUrl } from '#shared/network'
import { attempt } from '#shared/utils'
import { ensureServiceCertificate } from '#lib/tls'
import {
  defaultServiceWantedHook,
  defaultRecreateServiceHook,
  defaultRestartServiceHook,
} from './index.mjs'
import { log, utils } from '../utils.mjs'

const dbClient = restClient(`http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}db:4001`)

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'db',
  hooks: {
    /*
     * Lifecycle hook to determine the service status (runs every heartbeat)
     */
    heartbeat: async () => {
      const result = await testUrl(
        `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}db:${utils.getPreset('MORIO_DB_HTTP_PORT')}/readyz`,
        {
          returnAs: 'json',
        }
      )

      const status = result && result.indexOf('node ok') ? 0 : 1
      utils.setServiceStatus('db', status)

      return status === 0 ? true : false
    },
    /*
     * Lifecycle hook to determine whether the container is wanted
     * We just reuse the default hook here, checking for ephemeral state
     */
    wanted: defaultServiceWantedHook,
    /**
     * Lifecycle hook for anything to be done prior to creating the container
     *
     * We make sure the `/etc/morio/db` and `/morio/data/db` folders exist on this node
     */
    precreate: ensureLocalPrerequisites,
    /*
     * Lifecycle hook to determine whether to recreate the container
     * We just reuse the default hook here, checking for changes in
     * name/version of the container.
     */
    recreate: () => defaultRecreateServiceHook('db'),
    /**
     * Lifecycle hook to determine whether to restart the container
     * We just reuse the default hook here, checking whether the container
     * was recreated or is not running.
     */
    restart: (hookParams) => defaultRestartServiceHook('db', hookParams),
    /**
     * Lifecycle hook for anything to be done prior to starting the container
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    prestart: async () => await ensureServiceCertificate('db'),
    /**
     * Lifecycle hook for anything to be done after starting the container
     *
     * @return {boolean} success - Indicates lifecycle hook success
     */
    poststart: async () => {
      /*
       * Make sure database is up
       */
      const up = await attempt({
        every: 5,
        timeout: 60,
        run: async () => await isDbUp(),
        onFailedAttempt: (s) =>
          log.debug(`Waited ${s} seconds for database, will continue waiting.`),
      })
      if (up) log.debug(`Database is up.`)
      else {
        log.warn(`Database did not come up before timeout. Not creating tables.`)
        return
      }

      /*
       * Ensure tables exist, no need to await this as it only will make a change
       * the very first time the DB is bootstrapped.
       */
      ensureTablesExist()

      return true
    },
  },
}

async function ensureLocalPrerequisites() {
  for (const dir of ['/etc/morio/db', '/morio/data/db']) await mkdir(dir)

  return true
}

/**
 * This method checks whether or not the database is up
 *
 * @return {bool} result - True if the database is up, false if not
 */
async function isDbUp() {
  const result = await testUrl(
    `http://${utils.getPreset('MORIO_CONTAINER_PREFIX')}db:${utils.getPreset('MORIO_DB_HTTP_PORT')}/readyz`,
    {
      ignoreCertificate: true,
      // This endpoint does not return JSON
      returnAs: 'text',
    }
  )

  return result && result.includes('node ok') ? true : false
}

/**
 * Helper method to create database tables
 */
async function ensureTablesExist() {
  let initial = false
  for (const [table, q] of Object.entries(utils.getMorioServiceConfig('db').schema || {})) {
    log.debug(`[db] Ensuring database schema: ${table}`)
    const result = await dbClient.post(`/db/execute`, Array.isArray(q) ? q : [q])
    if (result[1]?.results?.[0]?.error) {
      if (result[1].results[0].error.includes('already exists'))
        log.debug(`[db] Table ${table} already existed`)
      else log.warn(result[1].results[0].error, `Failed to create table ${table}`)
    } else if (result[0] === 200) {
      log.debug(`[db] Table ${table} created`)
      initial = true
    } else log.warn(`Failed to create table ${table} for an unknown reason`)
  }
  if (initial) {
    /*
     * This means we have just bootstrapped the database
     * we will also create the root account
     */
    const now = new Date().toISOString()
    const root = await dbClient.post(`/db/execute`, [
      [
        `REPLACE INTO accounts(created_at, about, created_by, status, role, id, provider) ` +
          `VALUES(:created_at, :about, :created_by, :status, :role, :id, :provider)`,
        {
          created_at: now,
          about: 'Built-in Morio root account',
          created_by: 'mrt.root',
          status: 'active',
          role: 'root',
          id: 'mrt.root',
          provider: 'mrt',
        },
      ],
    ])
    if (root[0] === 200) log.debug(`[db] Created root account`)
    else log.warn(`[db] Failed to create root account`)
  }
}
