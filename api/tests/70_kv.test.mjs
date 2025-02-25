import { store, api, readPersistedData } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('KV Store', async () => {
  const data = await readPersistedData()
  store.set('mrt', data.mrt)

  // POST /kv/keys/test
  it(`Should POST /kv/keys/test`, async () => {
    const value = 'Test value'
    const result = await api.post(`/kv/keys/test`, { value })
    assert.equal(result[0], 204)
  })

  // POST /kv/keys/nested/path/key/with/some/depth
  const nested = 'nested/path/key/with/some/depth'
  it(`Should POST /kv/keys/${nested}`, async () => {
    const value = 'Test value nested key'
    const result = await api.post(`/kv/keys/${nested}`, { value })
    assert.equal(result[0], 204)
  })

  // POST /kv/keys/nested/path/key/with/some/depth?query=data#anchor-data
  it(`Should POST /kv/keys/${nested}?query=data#anchor-data`, async () => {
    const value = 'Test value nested key (with anchor/query data)'
    const result = await api.post(`/kv/keys/${nested}?query=data#anchor-data`, { value })
    assert.equal(result[0], 204)
  })

  // POST /kv/keys/morio/internal/key
  const internal = 'morio/internal/key'
  it(`Should POST /kv/keys/${internal}`, async () => {
    const value = 'Test morio/internal key'
    const result = await api.post(`/kv/keys/${internal}`, { value })
    assert.equal(result[0], 400)
  })

  // GET /kv/keys/test
  it(`Should GET /kv/keys/test`, async () => {
    const result = await api.get(`/kv/keys/test`)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(Object.keys(d).length, 2)
    assert.equal(d.key, 'test')
    assert.equal(d.value, 'Test value')
  })

  // GET /kv/keys/test
  it(`Should GET /kv/keys/${nested}`, async () => {
    const result = await api.get(`/kv/keys/${nested}`)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(Object.keys(d).length, 2)
    assert.equal(d.key, nested)
    assert.equal(d.value, 'Test value nested key (with anchor/query data)')
  })

  // GET /kv/keys/list
  it(`Should GET /kv/keys`, async () => {
    const result = await api.get(`/kv/keys`)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.includes('test'), true)
    assert.equal(d.includes(nested), true)
  })

  // GET /kv/glob/nested/*
  it(`Should GET /kv/glob/nested/*`, async () => {
    const result = await api.get(`/kv/glob/nested/*`)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length, 0)
  })

  // GET /kv/glob/nested/**
  it(`Should GET /kv/glob/nested/**`, async () => {
    const result = await api.get(`/kv/glob/nested/**`)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length, 1)
  })

  // GET /kv/glob/nested/**
  it(`Should GET /kv/glob/nested/path/key/with/some/*`, async () => {
    const result = await api.get(`/kv/glob/nested/path/key/with/some/*`)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(Array.isArray(d), true)
    assert.equal(d.length, 1)
  })

  // DELETE /kv/keys/test
  it(`Should DELETE /kv/keys/test`, async () => {
    const result = await api.delete(`/kv/keys/test`)
    assert.equal(result[0], 204)
  })

  // GET /kv/keys/test
  it(`Should GET /kv/keys/test (but it's not longer there)`, async () => {
    const result = await api.get(`/kv/keys/test`)
    assert.equal(result[0], 404)
  })

  // DELETE /kv/keys/test
  it(`Should DELETE /kv/keys/test (but it's no longer there)`, async () => {
    const result = await api.delete(`/kv/keys/test`)
    assert.equal(result[0], 404)
  })

  // GET /kv/dump
  it(`Should GET /kv/dump`, async () => {
    const result = await api.get(`/kv/dump`)
    assert.equal(result[0], 200)
  })
})
