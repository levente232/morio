import { api, validateErrorResponse } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { pkg, corePkg } from '../api/tests/json-loader.mjs'
import { errors } from '../api/src/errors.mjs'

describe('Ephemeral API: Status Routes', () => {
  it('Should load /status', async () => {
    const result = await api.get('/status')

    assert.equal(true, Array.isArray(result))
    // assert.equal(3, result.length, 3)  // return array only contains 2 [success, body]
    assert.equal(2, result.length)
    assert.equal(200, result[0])
    const d = result[1]
    // core.status
    assert.equal(typeof d, 'object')
    // info
    assert.equal(typeof d.info, 'object')
    assert.equal(d.info.name, pkg.name)
    assert.equal(d.info.about, pkg.description)
    assert.equal([pkg.version, 'dev-build'].includes(d.info.version), true)
    // assert.equal(d.info.production, false)   // productions shows true
    assert.equal(d.info.production, true)
    // state
    assert.equal(typeof d.info, 'object')
    assert.equal(d.state.ephemeral, true)
    assert.equal(typeof d.state.uptime, 'number')
    assert.equal(typeof d.state.start_time, 'number')
    assert.equal(typeof d.state.reload_count, 'number')
    assert.equal(d.state.config_resolved, true)
    assert.equal(d.state.settings_serial, 0)
    // core
    assert.equal(typeof d.core, 'object')
    // core.info
    assert.equal(typeof d.core.info, 'object')
    assert.equal(d.core.info.name, corePkg.name)
    assert.equal(d.core.info.about, corePkg.description)
    assert.equal(d.core.info.version, corePkg.version)
    // assert.equal(d.core.info.production, false)   // productions shows true
    assert.equal(d.info.production, true)
    // core.status
    assert.equal(typeof d.core.status.cluster, 'object')
    assert.equal(d.core.status.cluster.code, 1)
    assert.equal(d.core.status.cluster.color, 'amber')
    assert.equal(typeof d.core.status.cluster.time, 'number')
  })

  /*
   * GET /up
   * No response body
   */
  it('Should load /up', async () => {
    const result = await api.get('/status')
    assert.equal(true, Array.isArray(result), true)
    // assert.equal(3, result.length, 3)  // return array only contains 2 [success, body]
    assert.equal(2, result.length)
    assert.equal(200, result[0])
  })
})

describe('Ephemeral API: Non-available Routes', () => {
  const test = {
    get: [
      '/accounts',
      '/apikeys',
      '/token',
      '/whoami',
      '/docker/containers/',
      '/docker/containers/id',
      '/docker/containers/id/logs',
      '/docker/containers/id/stats',
      '/docker/images/id',
      '/docker/images/id/history',
      '/docker/networks/id',
      '/docker/info',
      '/docker/containers',
      '/docker/df',
      '/docker/allcontainers',
      '/docker/images',
      '/docker/networks',
      '/docker/running-containers',
      '/docker/version',
      '/ca/certificates',
      '/logs/service',
      '/pkgs/clients/deb/defaults',
      '/config',
      '/settings',
      '/idps',
      '/presets',
      '/jwks',
      '/status_logs',
      '/downloads',
      '/validate/ping',
    ],
    patch: ['/apikeys/key/action'],
    post: [
      '/account',
      '/activate-account',
      '/activate-mfa',
      '/apikey',
      '/login',
      '/settings',
      '/ca/certificate',
      '/encrypt',
      '/decrypt',
      '/pkgs/clients/deb/build',
    ],
    put: [
      '/docker/containers/id/kill',
      '/docker/containers/id/pause',
      '/docker/containers/id/restart',
      '/docker/containers/id/start',
      '/docker/containers/id/stop',
      '/docker/containers/id/unpause',
    ],
    delete: ['/apikeys/key'],
  }

  /*
   * Loop all GET endpoints that should not be available in ephemeral mode
   * Example return:
   * {
   *   status: 409,
   *   title: 'Not available in ephemeral mode',
   *   detail: 'This endpoint is not available when Morio is running in ephemeral mode. Since this system has not yet been set up, this endpoint is not yet available.',
   *   type: 'https://morio.it/reference/errors/morio.api.ephemeral.prohibited',
   *   instance: 'http://api:3000/idps'
   * }
   */
  for (const url of test.get) {
    it(`Should not GET ${url} in ephemeral mode`, async () => {
      const result = await api.get(url)

      validateErrorResponse(result, errors, 'morio.api.ephemeral.prohibited')
    })
  }

  /*
   * Loop all POST endpoints that should not be available in ephemeral mode
   */
  for (const url of test.post) {
    it(`Should not POST ${url} in ephemeral mode`, async () => {
      const result = await api.post(url, {})
      validateErrorResponse(result, errors, 'morio.api.ephemeral.prohibited')
    })
  }

  /*
   * Loop all PATCH endpoints that should not be available in ephemeral mode
   */
  for (const url of test.patch) {
    it(`Should not PATCH ${url} in ephemeral mode`, async () => {
      const result = await api.patch(url, {})
      validateErrorResponse(result, errors, 'morio.api.ephemeral.prohibited')
    })
  }

  /*
   * Loop all DELETE endpoints that should not be available in ephemeral mode
   */
  for (const url of test.delete) {
    it(`Should not DELETE ${url} in ephemeral mode`, async () => {
      const result = await api.remove(url)
      validateErrorResponse(result, errors, 'morio.api.ephemeral.prohibited')
    })
  }

  /*
   * Loop all PUT endpoints that should not be available in ephemeral mode
   */
  for (const url of test.put) {
    it(`Should not PUT ${url} in ephemeral mode`, async () => {
      const result = await api.put(url, {})
      validateErrorResponse(result, errors, 'morio.api.ephemeral.prohibited')
    })
  }
})
