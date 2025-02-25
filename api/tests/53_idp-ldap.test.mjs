import { store, api, validateErrorResponse } from './utils.mjs'
import { errors } from '../src/errors.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('API IDP/LDAP Tests', () => {
  // POST /login (valid LDAP user but no access)
  it(`Should POST /login (user, LDAP user without Morio access)`, async () => {
    const data = {
      provider: 'ldap',
      data: {
        username: 'user1',
        password: 'password1',
        role: 'user',
      },
    }
    const result = await api.post(`/login`, data)
    validateErrorResponse(result, errors, 'morio.api.account.role.unavailable')
  })

  // POST /login (user2 as manager)
  it(`Should POST /login (user2 as manager)`, async () => {
    const data = {
      provider: 'ldap',
      data: {
        username: 'user2',
        password: `password2`,
        role: 'manager',
      },
    }
    const result = await api.post(`/login`, data)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.jwt, 'string')
    assert.equal(d.data.user, 'user2')
    assert.equal(d.data.role, 'manager')
    assert.equal(d.data.highest_role, 'manager')
    assert.equal(d.data.provider, 'ldap')
    store.ldap_user2_jwt = d.jwt
  })

  // POST /login (user2 as user)
  it(`Should POST /login (user2 as user)`, async () => {
    const data = {
      provider: 'ldap',
      data: {
        username: 'user2',
        password: `password2`,
        role: 'user',
      },
    }
    const result = await api.post(`/login`, data)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.jwt, 'string')
    assert.equal(d.data.user, 'user2')
    assert.equal(d.data.role, 'user')
    assert.equal(d.data.highest_role, 'manager')
    assert.equal(d.data.provider, 'ldap')
  })

  // POST /login (user3 as operator)
  it(`Should POST /login (user3 as operator)`, async () => {
    const data = {
      provider: 'ldap',
      data: {
        username: 'user3',
        password: `password3`,
        role: 'operator',
      },
    }
    const result = await api.post(`/login`, data)
    const d = result[1]
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(typeof d.jwt, 'string')
    assert.equal(d.data.user, 'user3')
    assert.equal(d.data.role, 'operator')
    assert.equal(d.data.highest_role, 'operator')
    assert.equal(d.data.provider, 'ldap')
    store.ldap_user3_jwt = d.jwt
  })

  // POST /login (invalid credentials)
  it(`Should POST /login (wrong password)`, async () => {
    const data = {
      provider: 'ldap',
      data: {
        username: 'user2',
        password: `wrong`,
        role: 'user',
      },
    }
    const result = await api.post(`/login`, data)
    validateErrorResponse(result, errors, 'morio.api.account.credentials.mismatch')
  })

  // POST /login (unavailable role)
  it(`Should POST /login (unavailable role)`, async () => {
    const data = {
      provider: 'ldap',
      data: {
        username: 'user2',
        password: `password2`,
        role: 'engineer',
      },
    }
    const result = await api.post(`/login`, data)
    validateErrorResponse(result, errors, 'morio.api.account.role.unavailable')
  })

  // POST /login (non-existing role)
  it(`Should POST /login (non-existing role)`, async () => {
    const data = {
      provider: 'ldap',
      data: {
        username: 'user3',
        password: `password3`,
        role: 'schmuser',
      },
    }
    const result = await api.post(`/login`, data)
    validateErrorResponse(result, errors, 'morio.api.schema.violation')
  })

  // GET /whoami (JWT in Bearer header)
  it(`Should GET /whoami (JWT in Bearer header)`, async () => {
    const result = await api.get(`/whoami`, { Authorization: `Bearer ${store.ldap_user2_jwt}` })
    assert.equal(result[0], 200)
    const d = result[1]
    assert.equal(d.user, 'user2')
    assert.equal(d.role, 'manager')
    assert.equal(d.highest_role, 'manager')
    assert.equal(d.provider, 'ldap')
    for (const field of ['aud', 'iss', 'sub']) assert.equal(d[field], 'morio')
    for (const field of ['node', 'cluster']) assert.equal(typeof d[field], 'string')
    for (const field of ['iat', 'nbf', 'exp']) assert.equal(typeof d[field], 'number')
  })

  // GET /auth (JWT in Bearer header)
  it(`Should GET /auth (JWT in Bearer header)`, async () => {
    const result = await api.get(`/auth`, {
      'X-Forwarded-Uri': '/-/api/whoami',
      'X-Morio-Service': 'api',
      Authorization: `Bearer ${store.ldap_user3_jwt}`,
    })
    assert.equal(result[0], 200)
  })
})
