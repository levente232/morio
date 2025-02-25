import https from 'https'
import axios from 'axios'
import { strict as assert } from 'node:assert'
import { getPreset } from '../config/index.mjs'
import { Store } from '../shared/src/store.mjs'
import { logger } from '../shared/src/logger.mjs'
import { attempt, sleep } from '../shared/src/utils.mjs'
import { sharedStorage } from './disk-storage.mjs'
import dotenv from 'dotenv'

dotenv.config()

const store = new Store().set('log', logger('trace'))

// Create a global httpsAgent for requests with ignored SSL certificates
const globalHttpsAgent = new https.Agent({ rejectUnauthorized: false })

const brokerNodes = process.env.MORIO_TEST_DNS_NAMES
  ? process.env.MORIO_TEST_DNS_NAMES.split(',').map((name) => name.trim())
  : []

const fqdn = process.env.MORIO_TEST_FQDN ? process.env.MORIO_TEST_FQDN : process.env.MORIO_TEST_HOST

const hostName = fqdn.split('.')[0]

const setup = {
  cluster: {
    name: 'Morio Unit Tests',
    broker_nodes: brokerNodes,
    ...(brokerNodes.length > 1 && { fqdn: fqdn }),
  },
  iam: {
    providers: {
      apikey: {
        provider: 'apikey',
        id: 'apikey',
        label: 'API Key',
      },
      mrt: {},
      local: {
        provider: 'local',
        id: 'local',
        label: 'Morio Account',
      },
      // ldap: {
      //   provider: 'ldap',
      //   about: 'Test LDAP server',
      //   server: {
      //     url: 'ldap://ldap:10389',
      //     bindDN: 'uid=admin,ou=system,dc=ldap,dc=unit,dc=test,dc=morio,dc=it',
      //     bindCredentials: 'secret',
      //     searchBase: 'ou=system,dc=ldap,dc=unit,dc=test,dc=morio,dc=it',
      //     searchFilter: '(&(objectClass=user)(uid={{username}}))',
      //   },
      //   username_field: 'username',
      //   label: 'LDAP Test Server',
      //   rbac: {
      //     user: {
      //       attribute: 'uid',
      //       regex: '.',
      //     },
      //     root: {
      //       attribute: 'employeeType',
      //       regex: 'admin',
      //     },
      //   },
      // },
    },
    ui: {
      visibility: {
        local: 'full',
        mrt: 'icon',
        apikey: 'icon',
        // ldap: 'icon',
      },
      order: [
        'local',
        'apikey',
        'mrt',
        // , 'ldap'
      ],
    },
  },
  tokens: {
    secrets: {
      TEST_SECRET_1: 'super secret',
      TEST_SECRET_2: 'super secret either',
      AD_PASSWORD: 'super critical password',
    },
  },
}

async function __withoutBody(
  method,
  url,
  raw = false,
  log = false,
  ignoreCertificate = true,
  jwtToken = null,
  cookie = null
) {
  const requestConfig = {
    method: method.toUpperCase(), // Accepts "GET" or "DELETE"
    headers: {
      'Content-Type': 'application/json',
      ...(jwtToken && { Authorization: `Bearer ${jwtToken.jwt}` }),
      ...(cookie && { cookie: `morio=${cookie}` }),
    },
    url: url,
    ...(ignoreCertificate ? { httpsAgent: globalHttpsAgent } : {}),
  }

  try {
    const response = await axios(requestConfig)

    const body = raw ? response.data : response.data
    return [response.status, body]
  } catch (err) {
    if (log) console.error({ url, err })
    return [err.response?.status || 500, err.response?.data || 'An error occurred']
  }
}

async function __withBody(
  method,
  url,
  data,
  raw = false,
  log = false,
  ignoreCertificate = true,
  jwtToken = null
) {
  const requestConfig = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      ...(jwtToken && { Authorization: `Bearer ${jwtToken.jwt}` }),
    },
    data,
    ...(ignoreCertificate && { httpsAgent: globalHttpsAgent }),
  }

  try {
    const response = await axios(requestConfig)

    if (response.status === 204) return [response.status, {}]
    const parsedData = raw ? response.data : response.data
    return [response.status, parsedData]
  } catch (err) {
    if (log) console.error({ url, err })
    return [err.response?.status || 500, err.response?.data || 'An error occurred']
  }
}

function restClient(api) {
  return {
    get: (url, raw, log, ignoreCertificate, jwtToken, cookie) =>
      __withoutBody('GET', api + url, raw, log, ignoreCertificate, jwtToken, cookie),
    post: (url, data, raw, log, ignoreCertificate, jwtToken) =>
      __withBody('POST', api + url, data, raw, log, ignoreCertificate, jwtToken),
    put: (url, data, raw, log, ignoreCertificate) =>
      __withBody('PUT', api + url, data, raw, log, ignoreCertificate),
    patch: (url, data, raw, log, ignoreCertificate, jwtToken) =>
      __withBody('PATCH', api + url, data, raw, log, ignoreCertificate, jwtToken),
    remove: (url, raw, log, ignoreCertificate, jwtToken) =>
      __withoutBody('DELETE', api + url, raw, log, ignoreCertificate, jwtToken),
  }
}

function validateErrorResponse(result, errors, template) {
  const err = errors[template]

  if (!err) assert.equal('This is not a known error template', template)
  else {
    assert.equal(Array.isArray(result), true)
    assert.equal(2, result.length)
    assert.equal(result[0], err.status)
    assert.equal(typeof result[1], 'object')
    assert.equal(result[1].title, err.title)
    assert.equal(result[1].type, `${getPreset('MORIO_ERRORS_WEB_PREFIX')}${template}`)
    assert.equal(result[1].detail, err.detail)
    assert.equal(typeof result[1].instance, 'string')
  }
}

const core = restClient(`http://core:${getPreset('MORIO_CORE_PORT')}`)

async function isCoreReady() {
  const res = await core.get('/status')
  const [status, result] = res

  return status === 200 && result.node.config_resolved === true ? true : false
}

const api = restClient(`https://${process.env.MORIO_TEST_HOST}/-/api`)

async function isApiReady() {
  const [status, result] = await api.get('/status')

  return status === 200 && result.state.config_resolved === true ? true : false
}

const accounts = {
  user: {
    username: `testaccount${Date.now()}`,
    about: 'This account was created as part of a test',
    provider: 'local',
    role: 'engineer',
  },
}

function clean(username) {
  return username === null ? null : String(username).toLowerCase().trim()
}

export {
  accounts,
  sharedStorage,
  core,
  store,
  isCoreReady,
  isApiReady,
  validateErrorResponse,
  restClient,
  getPreset,
  attempt,
  sleep,
  setup,
  api,
  brokerNodes,
  fqdn,
  hostName,
  clean,
}
