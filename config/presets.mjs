import { pkg } from './json-loader.mjs'

/*
 * Morio presets
 */
export const presets = {}
/*
 * Using predocs because it is the same length as presets
 * which make this file easier to read, but we export it
 * as presetDocs
 */
const predocs = {}
export const presetDocs = predocs

predocs.MORIO_VERSION = `The Morio version number`
presets.MORIO_VERSION = pkg.version

predocs.MORIO_VERSION_TAG = `The Morio version tag, which is the version number
prefixed with 'v'`
presets.MORIO_VERSION_TAG = `v${pkg.version}`

predocs.MORIO_DOCKER_SOCKET = `The location of the Docker socket on the host
OS.

You typically would change this on a fresh Morio install, although technically
it can also be changed on a running Morio system.  To do so:

  - Update the \`/etc/morio/moriod/moriod.env\` file and set your custom
  location for the Docker socket
  - Run \`sudo systemctl daemon-reload\` to reload the systemd unit files
  - Restart Morio by running: \`sudo morio restart\`
`
presets.MORIO_DOCKER_SOCKET = '/var/run/docker.sock'

predocs.MORIO_CONFIG_ROOT = `Location of the Morio configuration folder on the
host OS.

You can only change this on a fresh Morio install. To do so:

  - Update the \`/etc/morio/moriod/moriod.env\` file and set your custom
  location for the config root
  - Run \`sudo systemctl daemon-reload\` to reload the systemd unit files
  - Restart Morio by running: \`sudo morio restart\`
`
presets.MORIO_CONFIG_ROOT = '/etc/morio/moriod'

predocs.MORIO_DATA_ROOT = `Location of the Morio data folder on the host OS.

You can only change this on a fresh Morio install. To do so:

  - Update the \`/etc/morio/moriod/moriod.env\` file and set your custom
  location for the data root
  - Run \`sudo systemctl daemon-reload\` to reload the systemd unit files
  - Restart Morio by running: \`sudo morio restart\`
`
presets.MORIO_DATA_ROOT = '/var/lib/morio/moriod'

predocs.MORIO_LOGS_ROOT = `Location of the Morio logs folder on the host OS.

You would typically change this on a fresh Morio install, but it can also be
changed on a running Morio instance. To do so:

  - Update the \`/etc/morio/moriod/moriod.env\` file and set your custom
  location for the logs root
  - Run \`sudo systemctl daemon-reload\` to reload the systemd unit files
  - Restart Morio by running: \`sudo morio restart\`
`
presets.MORIO_LOGS_ROOT = '/var/log/morio/moriod'

predocs.MORIO_DOWNLOADS_FOLDER = 'Name of the Morio public downloads folder'
presets.MORIO_DOWNLOADS_FOLDER = 'downloads'

predocs.MORIO_RELEASE_CHANNEL = 'Name of the release channel to load containers from'
presets.MORIO_RELEASE_CHANNEL = 'stable'

predocs.MORIO_REPOS_FOLDER = 'Name of the Morio public repositories folder'
presets.MORIO_REPOS_FOLDER = 'repos'

predocs.MORIO_NETWORK = 'Name of the internal Morio Docker network'
presets.MORIO_NETWORK = 'morionet'

predocs.MORIO_NETWORK_SUBNET = `Subnet to use for the internal Morio Docker
network.

You may need to change this if you have clients that connect from a network
that shares the same subnet.  In this case, the client will not be able to
communicate since it will seem to be local when it is not.

In this case, and probably only in this case, you should change the subnet to
any other private network.

To change this, set \`tokens.presets.MORIO_NETWORK_SUBNET\` in your Morio
settings.`
presets.MORIO_NETWORK_SUBNET = '192.168.144.32/27'

predocs.MORIO_NETWORK_MTU = `MTU to configure on the internal Morio Docker
network.

If you are considering changing the MTU, you probably know what you're doing.
In general, this can be useful to avoid fragmentation.

To change this, set \`tokens.presets.MORIO_NETWORK_MTU\` in your Morio
settings.`
presets.MORIO_NETWORK_MTU = 1500

predocs.MORIO_ERRORS_WEB_PREFIX = 'Web URL prefix for linking to errors'
presets.MORIO_ERRORS_WEB_PREFIX = 'https://morio.it/docs/reference/errors/'

predocs.MORIO_CONTAINER_PREFIX = 'Prefix used in container images for Morio'
presets.MORIO_CONTAINER_PREFIX = 'morio-'

predocs.MORIO_CONTAINER_TAG =
  'The currently running container tag. Picked up from environment variables.'
presets.MORIO_CONTAINER_TAG = 'dev-build'

predocs.MORIO_RELEASE_CHANNEL = 'The current release channel. Picked up from environment variables.'
presets.MORIO_RELEASE_CHANNEL = 'dev'

predocs.MORIO_TEMPLATE_TAGS = 'Custom Mustache delimiters to use'
presets.MORIO_TEMPLATE_TAGS = ['{|', '|}']

/*
 * Docker presets
 */

predocs.MORIO_DOCKER_LOG_DRIVER = `The Docker log driver to use for created
containers.

Morio assumes that \`systemd\` is present, and so we use the \`journald\` log
driver for Docker. If you are running Morio on a system without \`systemd\`
you will need to change this.

You should change this on a fresh Morio install. To do so:

  - Update the \`/etc/morio/moriod/moriod.env\` file and set your custom
  log driver for Docker
  - Run \`sudo systemctl daemon-reload\` to reload the systemd unit files
  - Restart Morio by running: \`sudo morio restart\`

:::warning FIXME
This is not yet implemented
:::
`
presets.MORIO_DOCKER_LOG_DRIVER = 'journald'

predocs.MORIO_DOCKER_ADD_HOST = `Optional \`host:ip\` resolution to add to the
containers configuration.

This is typically used to facilitate the development or testing of Morio.
It is not the kind of setup that you want to run in production: use DNS instead.

To update this, set the \`MORIO_DOCKER_ADD_HOST\` environment variable when
launching the Morio core container.`
presets.MORIO_DOCKER_ADD_HOST = false

/*
 * API presets
 */

predocs.MORIO_API_JWT_EXPIRY = `Maximum lifetime of a JSON Web Token generated
by Morio.

The notation here is the one used by [Go's time
package](https://pkg.go.dev/time#ParseDuration).

To change this, set \`tokens.presets.MORIO_API_JWT_EXPIRY\` in your Morio
settings.`
// Lifetime of an API JSON Web Token
presets.MORIO_API_JWT_EXPIRY = '12h'

predocs.MORIO_API_PREFIX = `URL prefix for accessing the API service through
the proxy service`
presets.MORIO_API_PREFIX = '/-/api'

predocs.MORIO_API_LOG_LEVEL = `Log level of the API service.
One of \`trace\`, \`debug\`, \`info\`, \`warn\`, \`error\`, \`fatal\`, or
\`silent\`.

To change this, set \`tokens.presets.MORIO_API_LOG_LEVEL\` in your Morio
settings.`
presets.MORIO_API_LOG_LEVEL = 'trace'

predocs.MORIO_API_PORT = 'TCP port for the API service to listen on'
presets.MORIO_API_PORT = 3000

/*
 * Broker presets
 */

predocs.MORIO_BROKER_LOG_LEVEL = `Log level of the broker service.
One of \`all\`, \`trace\`, \`debug\`, \`info\`, \`warn\`, \`error\`, or
\`fatal\`.

To change this, set \`tokens.presets.MORIO_API_LOG_LEVEL\` in your Morio
settings.`
presets.MORIO_BROKER_LOG_LEVEL = 'warn'

predocs.MORIO_BROKER_CLIENT_TOPICS = `Broker topics that are writable by the
Morio client`
presets.MORIO_BROKER_CLIENT_TOPICS = [
  'alarms', // For alarms
  'audit', // For audit info/logs (think auditbeat)
  'checks', // For healthchecks
  'events', // For events (typically generated from other sources)
  'logs', // For logs
  'metrics', // For metrics
  'notifications', // For notifications
]

predocs.MORIO_BROKER_UID = 'User ID (UID) of the user running the broker service'
presets.MORIO_BROKER_UID = 101

predocs.MORIO_BROKER_KAFKA_API_INTERNAL_PORT = 'TCP port for the internal Kafka API to listen on'
presets.MORIO_BROKER_KAFKA_API_INTERNAL_PORT = 19092

predocs.MORIO_BROKER_KAFKA_API_EXTERNAL_PORT = 'TCP port for the external Kafka API to listen on'
presets.MORIO_BROKER_KAFKA_API_EXTERNAL_PORT = 9092

predocs.MORIO_BROKER_ADMIN_API_PORT = 'TCP port for the RedPanda Admin API to listen on'
presets.MORIO_BROKER_ADMIN_API_PORT = 9644

predocs.MORIO_BROKER_REST_API_PORT = 'TCP port for the RedPanda REST proxy to listen on'
presets.MORIO_BROKER_REST_API_PORT = 8082

predocs.MORIO_BROKER_RPC_SERVER_PORT = 'TCP port for the broker RPC service to listen on'
presets.MORIO_BROKER_RPC_SERVER_PORT = 33145

/*
 * CA presets
 */

predocs.MORIO_ROOT_CA_COMMON_NAME = `Common Name (CN) for the Morio Root
Certificate Authority.

You can only change this at the initial setup. To do so, set
\`tokens.presets.MORIO_ROOT_CA_COMMON_NAME\` in your initial Morio settings.`
presets.MORIO_ROOT_CA_COMMON_NAME = 'Morio Root Certificate Authority'

predocs.MORIO_INTERMEDIATE_CA_COMMON_NAME = `Common Name (CN) for the Morio
Intermediate Certificate Authority.

You can only change this at the initial setup. To do so, set
\`tokens.presets.MORIO_INTERMEDIATE_CA_COMMON_NAME\` in your initial Morio
settings.`
presets.MORIO_INTERMEDIATE_CA_COMMON_NAME = 'Morio Intermediate Certificate Authority'

predocs.MORIO_ROOT_CA_VALID_YEARS =
  'Lifetime of the certificate of the Morio Root Certificate Authority'
presets.MORIO_ROOT_CA_VALID_YEARS = 20

predocs.MORIO_INTERMEDIATE_CA_VALID_YEARS =
  'Lifetime of the certificate of the Morio Intermediate Certificate Authority'
presets.MORIO_INTERMEDIATE_CA_VALID_YEARS = 5

predocs.MORIO_CA_CERTIFICATE_LIFETIME_MIN = `Minimum lifetime of a certificate
generated by the Morio Certificate Authority.

You can only change this at the initial setup. To do so, set
\`tokens.presets.MORIO_CA_CERTIFICATE_LIFETIME_MIN\` in your initial Morio
settings.`
presets.MORIO_CA_CERTIFICATE_LIFETIME_MIN = '5m'

predocs.MORIO_CA_CERTIFICATE_LIFETIME_MAX = `Maximum lifetime of a certificate
generated by the Morio Certificate Authority.

You can only change this at the initial setup. To do so, set
\`tokens.presets.MORIO_CA_CERTIFICATE_LIFETIME_MAX\` in your initial Morio
settings.`
presets.MORIO_CA_CERTIFICATE_LIFETIME_MAX = '17544h'

predocs.MORIO_CA_CERTIFICATE_LIFETIME_DFLT = `Default lifetime of a certificate
generated by the Morio Certificate Authority.

You can only change this at the initial setup. To do so, set
\`tokens.presets.MORIO_CA_CERTIFICATE_LIFETIME_DFLT\` in your initial Morio
settings.`
presets.MORIO_CA_CERTIFICATE_LIFETIME_DFLT = '750h'

predocs.MORIO_CA_PORT = 'TCP port for the CA service to listen on'
presets.MORIO_CA_PORT = 9000

predocs.MORIO_CA_UID = 'User ID (UID) of the user running the CA service'
presets.MORIO_CA_UID = 1000

/*
 * Cache presets
 */
predocs.MORIO_CACHE_PORT = 'TCP port for the internal cache service to listen on'
presets.MORIO_CACHE_PORT = 6379

/*
 * Connnector presets
 */

predocs.MORIO_CONNECTOR_UID = 'User ID (UID) of the user running the Connector service'
presets.MORIO_CONNECTOR_UID = 1000

/*
 * Console presets
 */

predocs.MORIO_CONSOLE_PREFIX =
  'URL prefix for accessing the Console service through the proxy service'
presets.MORIO_CONSOLE_PREFIX = 'console'

predocs.MORIO_CONSOLE_PORT = 'TCP port for the Console service to listen on'
presets.MORIO_CONSOLE_PORT = 8080

/*
 * Core presets
 */

predocs.MORIO_CORE_CONFIG_FOLDER =
  'Location of the Morio configuration folder inside the core container'
presets.MORIO_CORE_CONFIG_FOLDER = '/etc/morio'

predocs.MORIO_CORE_LOG_LEVEL = `Log level of the Core service.
One of \`trace\`, \`debug\`, \`info\`, \`warn\`, \`error\`, \`fatal\`, or
\`silent\`.

To change this, set \`tokens.presets.MORIO_CORE_LOG_LEVEL\` in your Morio
settings.`
presets.MORIO_CORE_LOG_LEVEL = 'trace'

// Location of the logstash pipelines.folder
predocs.MORIO_CORE_LOGSTASH_PIPELINES_FOLDER =
  'Location of the Logstash pipelines config folder within the core container.'
presets.MORIO_CORE_LOGSTASH_PIPELINES_FOLDER = '/etc/morio/connector/pipelines'

// TCP port core should listen on
predocs.MORIO_CORE_PORT = 'TCP port for the _core service_ to listen on'
presets.MORIO_CORE_PORT = 3007

// API prefix (since the API is behind Traefik)
predocs.MORIO_CORE_PREFIX =
  'URL prefix for accessing the _core service_ through the _proxy service_'
presets.MORIO_CORE_PREFIX = '/-/core'

predocs.MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL =
  'Number of seconds to wait between cluster heartbeats'
presets.MORIO_CORE_CLUSTER_HEARTBEAT_INTERVAL = 30

predocs.MORIO_CORE_CLUSTER_HEARTBEAT_MAX_RTT = `Number of milliseconds above
which we start logging heartbeat latency.

You may want to increase this if you have cluster nodes behind a slower link.

To do so, set \`MORIO_CORE_CLUSTER_HEARTBEAT_MAX_RTT\` in your Morio settings.`
presets.MORIO_CORE_CLUSTER_HEARTBEAT_MAX_RTT = 150

predocs.MORIO_CORE_CLUSTER_STATE_CACHE_TTL = 'Amount of seconds to cache the cluster state'
presets.MORIO_CORE_CLUSTER_STATE_CACHE_TTL = 20

predocs.MORIO_CORE_UUID_FINGERPRINT_LENGTH =
  'Amount of characters to use for the short version (fingerprint) of a UUID'
presets.MORIO_CORE_UUID_FINGERPRINT_LENGTH = 6

/*
 * Database presets
 */

predocs.MORIO_DB_HTTP_PORT = 'TCP port for the _DB service_ to listen on_'
presets.MORIO_DB_HTTP_PORT = 4001

predocs.MORIO_DB_RAFT_PORT = 'TCP port for the  raft consensus protocol used by the _DB service_'
presets.MORIO_DB_RAFT_PORT = 4002

/*
 * Proxy presets
 */

predocs.MORIO_PROXY_LOG_LEVEL = `Log level for the _proxy service_. One of
\`TRACE\`, \`DEBUG\`, \`INFO\`, \`WARN\`, or \`ERROR\`.

To change this, set \`MORIO_PROXY_LOG_LEVEL\` in your Morio settings.`
presets.MORIO_PROXY_LOG_LEVEL = 'DEBUG'

predocs.MORIO_PROXY_ACCESS_LOG_FILEPATH =
  'Access log file path for Traefik inside the _proxy service_ container'
presets.MORIO_PROXY_ACCESS_LOG_FILEPATH = '/var/log/morio/traefik.access.log'

predocs.MORIO_PROXY_LOG_FILEPATH = 'Log file path for Traefik inside the _proxy service_ container'
presets.MORIO_PROXY_LOG_FILEPATH = '/var/log/morio/traefik.log'

predocs.MORIO_PROXY_LOG_FORMAT =
  'Log format for the _proxy service_. One of json or common. Common is plain text.'
presets.MORIO_PROXY_LOG_FORMAT = 'json'

/*
 * Tap presets
 */

predocs.MORIO_TAP_LOG_LEVEL = `Log level of the Tap service.
One of \`trace\`, \`debug\`, \`info\`, \`warn\`, \`error\`, \`fatal\`, or
\`silent\`.

To change this, set \`tokens.presets.MORIO_TAP_LOG_LEVEL\` in your Morio
settings.`
presets.MORIO_TAP_LOG_LEVEL = 'trace'

/*
 * UI presets
 */

predocs.MORIO_UI_PORT = 'TCP port for the _ui service_ to listen on'
presets.MORIO_UI_PORT = 3010

predocs.MORIO_UI_TIMEOUT_URL_CHECK = 'Number of milliseconds before a URL check should time out'
presets.MORIO_UI_TIMEOUT_URL_CHECK = 1500

/*
 * Web presets
 */

predocs.MORIO_WEB_HTTP_PORT = 'TCP port for the HTTP service of the _web service_ to listen on'
presets.MORIO_WEB_HTTP_PORT = 80

/*
 * Watcher presets
 */

predocs.MORIO_WATCHER_HTTP_PORT = 'TCP port for the HTTP API of the _watcher service_ to listen on'
presets.MORIO_WATCHER_HTTP_PORT = 5066

predocs.MORIO_WATCHER_PREFIX =
  'URL prefix for accessing the _watcher service_ through the _proxy service_'
presets.MORIO_WATCHER_PREFIX = '/-/watcher'

presets.MORIO_WATCHER_UID = 'User ID (UID) of the user running the watcher service'
presets.MORIO_WATCHER_UID = 1000

/*
 * X509 presets
 */

predocs.MORIO_X509_CN = `The default Common Name (CN) attribute for X.509
certificates generated by the _CA service_ of Morio.

To change this, set \`tokens.presets.MORIO_X509_CN\` in your Morio settings.`
presets.MORIO_X509_CN = 'Morio'

predocs.MORIO_X509_C = `The default Country (C) attribute for X.509
certificates generated by the _CA service_ of Morio.

To change this, set \`tokens.presets.MORIO_X509_C\` in your Morio settings.`
presets.MORIO_X509_C = 'BE'

predocs.MORIO_X509_ST = `The default state/locality (ST) attribute for X.509
certificates generated by the _CA service_ of Morio.

To change this, set \`tokens.presets.MORIO_X509_ST\` in your Morio settings.`
presets.MORIO_X509_ST = 'Brussels'

predocs.MORIO_X509_L = `The default Location (L) attribute for X.509
certificates generated by the _CA service_ of Morio.

To change this, set \`tokens.presets.MORIO_X509_L\` in your Morio settings.`
presets.MORIO_X509_L = 'Brussels'

predocs.MORIO_X509_O = `The default Organisation (O) attribute for X.509
certificates generated by the _CA service_ of Morio.

To change this, set \`tokens.presets.MORIO_X509_O\` in your Morio settings.`
presets.MORIO_X509_O = 'CERT-EU'

predocs.MORIO_X509_OU = `The default Organisational Unit (OU) attribute for
X.509 certificates generated by the _CA service_ of Morio.

To change this, set \`tokens.presets.MORIO_X509_OU\` in your Morio settings.`
presets.MORIO_X509_OU = 'Engineering Team'

/*
 * Putting this here, not sure where is the best place
 */
predocs.MORIO_ELASTIC_SOFTWARE_KEY = `The key used to sign software released by
Elastic. This is used by the client installer to set up the Elastic repository
which contains the dependencies of the client (the various Beats agents).`
presets.MORIO_ELASTIC_SOFTWARE_KEY = `-----BEGIN PGP PUBLIC KEY BLOCK-----

mQENBFI3HsoBCADXDtbNJnxbPqB1vDNtCsqhe49vFYsZN9IOZsZXgp7aHjh6CJBD
A+bGFOwyhbd7at35jQjWAw1O3cfYsKAmFy+Ar3LHCMkV3oZspJACTIgCrwnkic/9
CUliQe324qvObU2QRtP4Fl0zWcfb/S8UYzWXWIFuJqMvE9MaRY1bwUBvzoqavLGZ
j3SF1SPO+TB5QrHkrQHBsmX+Jda6d4Ylt8/t6CvMwgQNlrlzIO9WT+YN6zS+sqHd
1YK/aY5qhoLNhp9G/HxhcSVCkLq8SStj1ZZ1S9juBPoXV1ZWNbxFNGwOh/NYGldD
2kmBf3YgCqeLzHahsAEpvAm8TBa7Q9W21C8vABEBAAG0RUVsYXN0aWNzZWFyY2gg
KEVsYXN0aWNzZWFyY2ggU2lnbmluZyBLZXkpIDxkZXZfb3BzQGVsYXN0aWNzZWFy
Y2gub3JnPokBTgQTAQgAOAIbAwIXgBYhBEYJWsyFSFgsGiaZqdJ9ZmzYjkK0BQJk
9vrZBQsJCAcDBRUKCQgLBRYCAwEAAh4FAAoJENJ9ZmzYjkK00hoH+wYXZKgVb3Wv
4AA/+T1IAf7edwgajr58bEyqds6/4v6uZBneUaqahUqMXgLFRX5dBSrAS7bvE/jx
+BBQx+rpFGxSwvFegRevE1zAGVtpgkFQX0RpRcKSmksucSBxikR/dPn9XdJSEVa8
vPcs11V+2E5tq3LEP14zJL4MkJKQF0VJl5UUmKLS7U2F/IB5aXry9UWdMTnwNntX
kl2iDaViYF4MC6xTS24uLwND2St0Jvjt+xGEwbdBVvp+UZ/kG6IGkYM5eWGPuok/
DHvjUdwTfyO9b5xGbqn5FJ3UFOwB/nOSFXHM8rsHRT/67gHcIl8YFqSQXpIkk9D3
dCY+KieW0ue5AQ0EUjceygEIAOSVJc3DFuf3LsmUfGpUmnCqoUm76Eqqm8xynFEG
ZpczTChkwARRtckcfa/sGv376j+jk0c0Q71Uv3MnMLPGF+w3bpu8fLiPeW/cntf1
8uZ6DxJvHA/oaZZ6VPjwUGSeVydiPtZfTYsceO8Dxl3gpS6nHZ9Gsnfr/kcH9/11
Ca73HBtmGVIkOI1mZKMbANO8cewY/i7fPxShu7B0Rb3jxVNGUuiRcfRiao0gWx0U
ZGpvuHplt7loFX2cbsHFAp9WsjYEbSohb/Y0K4NkyFhL82MfbcsEwsXPhRTFgJWw
s4vpuFg/kFFlnw0NNPVP1jNJLNCsMBMEpP1A7k6MRpylNnUAEQEAAYkBNgQYAQgA
IAIbDBYhBEYJWsyFSFgsGiaZqdJ9ZmzYjkK0BQJk9vsHAAoJENJ9ZmzYjkK0hWsH
/ArKtn12HM3+41zYo9qO4rTri7+IYTjSB/JDTOusZgZLd/HCp1xQo4SI2Eur3Rtx
USMWK1LEeBzsjwDT9yVceYekrBEqUVyRMSVYj+UeZK2s4LbXm9b4jxXVtaivmkMA
jtznndrD7kmm8ak+UsZplf6p6uZS9TZ9hjwoMmw5oMaS6TZkLT4KYGWeyzHJSUBX
YikY6vssDQu4SJ07m1f4Hz81J39QOcHln5I5HTK8Rh/VUFcxNnGg9360g55wWpiF
eUTeMyoXpOtffiUhiOtbRYsmSYC0D4Fd5yJnO3n1pwnVVVsM7RAC22rc5j/Dw8dR
GIHikRcYWeXTYW7veewK5Ss=
=ftS0
-----END PGP PUBLIC KEY BLOCK-----`

/**
 * Helper method to load a preset
 *
 * If an environemnt variable with name key is set, this wil return it
 * If not, it will return the value from the presets
 *
 * @param {string} key - Name of the environment variable (or default) to return
 * @param {object} opts - An object to further control how this method behaves
 * @param {mixed} opts.dflt - Optional fallback/default for the requested key if the value is not set in env or presets
 * @param {string} opts.as - Optional type to cast the result to. One of bool, string, or number
 * @param {object} opts.alt - Optional object holding key/values that will be used as fallback/default if key is not set in env or presets. Takes precedence over opts.dflt
 * @param {object} opts.force - Optional object holding key/values that will override what is stored in env or presets
 * @return {mixed} value - The value in the environment variable of default
 */
export const getPreset = (key, opts = {}) => {
  /*
   * Attempt to load environment variable key
   */
  let result = process.env[key] /* eslint-disable-line no-undef */

  /*
   * If environment variable is not set, load it from presets/forced
   */
  if (typeof result === 'undefined')
    result = typeof opts.force === 'object' ? { ...presets, ...opts.force }[key] : presets[key]

  /*
   * If it is undefined at this point, check for fallback value in opts.alt
   */
  if (typeof result === 'undefined' && typeof opts.alt === 'object') result = opts.alt[key]

  /*
   * If it is undefined at this point, check for fallback value in opts.dflt
   */
  if (typeof result === 'undefined') result = opts.dflt

  /*
   * Optionally cast result as a specific type
   */
  if (opts.as === 'bool') return Boolean(result)
  else if (opts.as === 'string') return String(result)
  else if (opts.as === 'number') return Number(result)

  /*
   * Now return
   */
  return result
}

/*
 * Helper method to figure out whether or not we are running in production
 */
export const inProduction = () => {
  const env = getPreset('NODE_ENV', { dflt: 'production', as: 'string' })

  return env === 'production'
}

/**
 * Helper method to load all presets as a single object
 */
export const loadAllPresets = () => {
  const all = {}
  for (const key of Object.keys(presets).sort()) all[key] = getPreset(key)

  return all
}

/*
 * Helper object to know which presets are safe to change
 * This is use to build the auto-generated documentation
 */
export const presetsSafeToEdit = [
  'MORIO_DOCKER_SOCKET',
  'MORIO_CONFIG_ROOT',
  'MORIO_DATA_ROOT',
  'MORIO_LOGS_ROOT',
  'MORIO_NETWORK_SUBNET',
  'MORIO_NETWORK_MTU',
  'MORIO_DOCKER_LOG_DRIVER',
  'MORIO_DOCKER_ADD_HOST',
  'MORIO_API_JWT_EXPIRY',
  'MORIO_API_LOG_LEVEL',
  'MORIO_BROKER_LOG_LEVEL',
  'MORIO_ROOT_CA_COMMON_NAME',
  'MORIO_INTERMEDIATE_CA_COMMON_NAME',
  'MORIO_CA_CERTIFICATE_LIFETIME_MIN',
  'MORIO_CA_CERTIFICATE_LIFETIME_MAX',
  'MORIO_CA_CERTIFICATE_LIFETIME_DFLT',
  'MORIO_CORE_LOG_LEVEL',
  'MORIO_CORE_CLUSTER_HEARTBEAT_MAX_RTT',
  'MORIO_PROXY_LOG_LEVEL',
  'MORIO_X509_CN',
  'MORIO_X509_C',
  'MORIO_X509_ST',
  'MORIO_X509_L',
  'MORIO_X509_O',
  'MORIO_X509_OU',
]
