import Joi from 'joi'

/*
 * A little help to type less numbers
 */
const brokerNodesNumbers = [...Array(9).keys()].map((i) => i + 1)
const flankingNodesNumbers = [...Array(36).keys()].map((i) => i + 101)

/*
 * An FQDN
 */
const fqdn = Joi.string().hostname()

/*
 * Re-useable schema blocks
 */
const id = Joi.string().alphanum()

/*
 * A Javascript timestamp (in ms)
 */
const jsTime = Joi.number().min(172e10).max(199e10)

/*
 * A v4 UUID
 */
const uuid = Joi.string().guid({ version: 'uuidv4', separator: '-' })

/*
 * Morio version
 */
const version = Joi.string().min(2).max(64)

/*
 * Node serial (an integer)
 * Max 9 broker nodes, max 36 flanking nodes
 */
const nodeSerial = Joi.number().valid(...brokerNodesNumbers, ...flankingNodesNumbers)

/*
 * settings.broker_nodes
 */
const brokerNodes = Joi.array().items(fqdn).min(1).max(9).required()

/*
 * settings.client
 */
const client = Joi.object({
  modules: Joi.object().pattern(
    Joi.string(), // keys should be string
    Joi.string() // values should be string
  ),
})

/*
 * settings.flanking_nodes
 */

const flankingNodes = Joi.array().items(fqdn).min(0).max(36)

/*
 * The morio root token (mrt)
 */
const mrt = Joi.string()
  .length(68, 'utf8')
  .pattern(/^mrt\.[0-9a-z]+$/)

/*
 * The hash of any password or secret is structured like this
 */
const passwordHash = Joi.object({
  hash: Joi.string(),
  salt: Joi.string(),
})

/*
 * The contents of the keys object
 */
const keys = Joi.object({
  cluster: uuid.required(),
  icrt: Joi.string().required(),
  ikey: Joi.string().required(),
  jwk: Joi.object({
    kty: Joi.string().required(),
    kid: Joi.string().required(),
    n: Joi.string().required(),
    e: Joi.string().required(),
  }),
  jwt: Joi.string().required(),
  mrt: passwordHash.required(),
  pgpriv: Joi.string().required(),
  pgpub: Joi.string().required(),
  private: Joi.string().required(),
  public: Joi.string().required(),
  rcrt: Joi.string().required(),
  rfpr: Joi.string().base64().required(),
  rkey: Joi.string().required(),
  rpwd: Joi.string().required(),
  seal: passwordHash.required(),
  unseal: Joi.string().required(),
})

/*
 * The contents of the keys object
 */
const keysFile = Joi.object({
  data: Joi.string().required(),
  key: Joi.string().required(),
  seal: passwordHash.required(),
})

/*
 * A vault secret
 */
const vaultSecret = Joi.object({
  vault: Joi.alternatives().try(
    Joi.string(),
    Joi.object({
      path: Joi.string().required(),
      key: Joi.string().required(),
      instance: Joi.string(),
    })
  ),
})

/*
 * A vault instance
 */
const vaultInstance = Joi.object({
  url: Joi.string().uri().required(),
  verify_certificate: Joi.boolean(),
  role: Joi.string(),
  jwt_auth_path: Joi.string(),
  kv_path: Joi.string(),
})

/*
 * Preseeded key data
 */
export const preseedKeys = Joi.object({
  data: Joi.string().required(),
  key: Joi.string()
    .pattern(/.*ENCRYPTED PRIVATE KEY.*/)
    .required(),
  seal: Joi.object({
    hash: Joi.string().hex().required(),
    salt: Joi.string().hex().required(),
  }),
})

/*
 * A preseed file object
 */
const preseedFile = Joi.alternatives().try(
  Joi.object({
    url: Joi.string().uri().required(),
    headers: Joi.object(),
    keys: preseedKeys,
  }),
  Joi.object({
    gitlab: Joi.object({
      url: Joi.string().uri().required(),
      project_id: Joi.number().required(),
      file_path: Joi.string().required(),
      ref: Joi.string(),
      token: Joi.alternatives().try(Joi.string(), vaultSecret).required(),
    }),
    keys: preseedKeys,
  }),
  Joi.object({
    github: Joi.object({
      url: Joi.string().uri(),
      owner: Joi.string().required(),
      repo: Joi.string().required(),
      file_path: Joi.string().required(),
      ref: Joi.string(),
      token: Joi.alternatives().try(Joi.string(), vaultSecret).required(),
    }),
    keys: preseedKeys,
  }),
  Joi.string()
)

/*
 * A git repository to load
 */
const gitRepo = Joi.object({
  id: Joi.string(),
  url: Joi.string().uri(),
  ref: Joi.string(),
  user: Joi.alternatives().try(Joi.string(), vaultSecret),
  token: Joi.alternatives().try(Joi.string(), vaultSecret),
})

/*
 * The Morio preseed object
 */
const preseed = Joi.alternatives().try(
  Joi.object({
    url: Joi.string(),
    git: Joi.object().pattern(Joi.string(), gitRepo),
    base: preseedFile,
    overlays: Joi.array().items(preseedFile),
    keys: preseedKeys,
    charts: Joi.array().items(preseedFile),
    processors: Joi.array().items(preseedFile),
    modules: Joi.array().items(preseedFile),
  }),
  Joi.string()
)

/*
 * The Morio settings object
 */
const settings = Joi.object({
  cluster: Joi.object({
    name: Joi.string()
      .required()
      .min(2)
      .max(255)
      .pattern(/^[A-Za-z0-9\s-_,.;:()]+$/),
    broker_nodes: brokerNodes,
    flanking_nodes: flankingNodes,
    fqdn: fqdn.when('broker_nodes', {
      is: Joi.array().max(1),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
  }),
  metadata: Joi.object({
    comment: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
    version: Joi.alternatives().try(Joi.string(), Joi.number()),
  }),
  connector: Joi.object(),
  tokens: Joi.object({
    flags: Joi.object({
      DISABLE_ROOT_TOKEN: Joi.boolean(),
      DISABLE_IDP_APIKEY: Joi.boolean(),
      DISABLE_IDP_LDAP: Joi.boolean(),
      DISABLE_IDP_LOCAL: Joi.boolean(),
      DISABLE_IDP_MRT: Joi.boolean(),
      DISABLE_IDP_OIDC: Joi.boolean(),
      DISABLE_SERVICE_UI: Joi.boolean(),
      ENFORCE_HTTP_MTLS: Joi.boolean(),
      ENFORCE_SERVICE_CACHE: Joi.boolean(),
      RESEED_ON_RELOAD: Joi.boolean(),
    }),
    secrets: Joi.object(),
    vars: Joi.object(),
  }),
  iam: Joi.object({
    providers: Joi.object(),
    ui: Joi.object({
      visibility: Joi.object(),
      order: Joi.array(),
    }),
  }),
  vault: vaultInstance,
  preseed,
  client,
  tap: Joi.object().optional(),
}).required()

/**
 * Validates input
 *
 * The Joi library throws when validation fails
 * NodeJS does not like it (at all) when you throw in async code
 * We could validate in sync, but NodeJS is single-threaded so if we
 * can async it, we should.
 *
 * This is why this wrapper function provides a try...catch block for validation
 *
 * @param {string} key - The key in the schema object holding the Joi schema
 * @param {object] input - The input to validate
 * @return {object} valid - The result of the Joi validation
 */
async function validate(key, input, schema) {
  const target = schema[key]
  if (target) {
    let valid
    try {
      valid = await target.validateAsync(input)
    } catch (err) {
      return [false, err]
    }

    return [valid, null]
  } else return [false, `No such schema key: ${key}`]
}

/*
 * Named exports
 */
export {
  Joi,
  validate,
  id,
  fqdn,
  jsTime,
  uuid,
  keys,
  keysFile,
  mrt,
  passwordHash,
  version,
  nodeSerial,
  settings,
  preseed,
}
