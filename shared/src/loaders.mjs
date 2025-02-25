import fs from 'node:fs'
import { testUrl } from './network.mjs'
import yaml from 'js-yaml'
import { Buffer } from 'node:buffer'
import { simpleGit } from 'simple-git'
import { hash } from './crypto.mjs'
import { rm, mkdir, readFile, writeFile, globDir } from './fs.mjs'
import { cloneAsPojo, get, set, setIfUnset, reverseString } from './utils.mjs'
import merge from 'lodash/merge.js'
import unset from 'lodash/unset.js'

/*
 * A collection of utils to load various files
 * Typically used to load the preseeded config
 */

/**
 * Helper method to parse a result as YAML or JSON
 *
 * @param {string} input - The input to parse
 * @param {bool} base64 - Whether or not the input is base64 encoded
 * @return {object|bool} - The object resulting from parsing input as YAML or JSON, or false if we failed
 */
function asJsonOrYaml(input, base64 = false) {
  const data = base64 ? Buffer.from(input, 'base64').toString('utf-8') : input
  try {
    const yml = yaml.load(data)
    if (yml) return yml
  } catch (err) {
    // So it's not yaml
  }
  try {
    const json = JSON.parse(data)
    if (json) return json
  } catch (err) {
    // So it's not json either?
  }

  return false
}

/**
 * Determines whether a file should be read from an API (github or gitlab)
 *
 * @param {string} url - The configured 'url' (not a real url)
 * @param {bool} result - True if it ends with "@{github/gitlab]"
 */
function fromApi(url) {
  const chunks = url.split('@')
  const api = chunks.length > 1 ? chunks.pop() : false

  return api && ['github', 'gitlab'].includes(api) ? api : false
}

/**
 * Determines whether a file should be read from a local git repo
 *
 * @param {string} url - The configured 'url' (not a real url)
 * @param {bool} result - True if it starts with 'git:'
 */
function fromRepo(url) {
  return url.slice(0, 4) === 'git:'
}

/**
 * Loads a glob pattern of files from a repo as data
 * (parses it as JSON or YAML)
 *
 * @param {string} pattern - The glob pattern
 * @param {string} repo - The repo ID (key in the preseed.git object)
 * @param {string} gitroot - Folder holding the cloned git repos
 * @param {array} found - Found files
 */
async function globDataFromRepo(pattern, repo, gitroot) {
  const found = await globDir(`${gitroot}/${sanitizeGitFolder(repo)}`, pattern)

  const data = []
  for (const file of found) {
    const content = await readFile(file)
    data.push(asJsonOrYaml(content))
  }

  return data
}

/**
 * Helper method to clone a git repository
 *
 * @param {string} gitroot - Folder in which to place the subfolder holding the repo
 * @param {string} id - id of this git repo in the preseed settings
 * @param {object} config - git preseed config
 * @param {object} log - Logger object
 */
async function loadGitRepo(gitroot, id, config, log) {
  const git = simpleGit({ baseDir: gitroot })
  const folder = sanitizeGitFolder(id)
  const dir = `${gitroot}/${folder}`
  let url

  if (config.url.slice(0, 7) === 'http://' && config.user && config.token) {
    url = `http://${config.user}:${config.token}@${config.url.slice(7)}`
  } else if (config.url.slice(0, 8) === 'https://') {
    url = `https://${config.user}:${config.token}@${config.url.slice(8)}`
  } else url = config.url

  /*
   * Ensure target folder exists and is empty
   */
  try {
    await rm(dir, { recursive: true, force: true }) // Do not mutate, just rm and re-clone
    await mkdir(dir, console.log)
  } catch (err) {
    log.warn(err, `Unable to create folder for git: ${dir}`)
    return false
  }

  /*
   * Now clone the repo
   */
  try {
    const cloneOptions = ['--depth=1', '--recurse-submodules', '--shallow-submodules']
    if (config.ref) cloneOptions.push([`--branch=${config.ref}`])
    await git.clone(url, dir, cloneOptions)
  } catch (err) {
    log.warn(err, `Unable to clone git repo ${config.id}: ${config.url}`)
    return false
  }

  return true
}

/**
 * Helper method to load a preseed base file
 *
 * @param {object} preseed - The preseed settings
 * @param {string} gitroot - Path to the root where git repos are stored
 * @return {object} settings - The loaded settings
 */
async function loadPreseedBaseFile(preseed, gitroot, log) {
  if (typeof preseed === 'string') return await loadPreseedFileFromUrl(preseed, log)
  if (typeof preseed.url === 'string') return await loadPreseedFileFromUrl(preseed, log)
  if (typeof preseed.base === 'string') {
    if (preseed.git && fromRepo(preseed.base))
      return await loadPreseedFileFromRepo(preseed.base, preseed, gitroot, log)
    else return await loadPreseedFileFromUrl(preseed.base, log)
  }
  if (preseed.base?.gitlab) return await loadPreseedFileFromGitlab(preseed.base, log)
  if (preseed.base?.github) return await loadPreseedFileFromGithub(preseed.base, log)
  if (preseed.base?.url) {
    if (preseed.git && fromRepo(preseed.base))
      return await loadPreseedFileFromRepo(preseed.base.url, preseed, gitroot, log)
    else return await loadPreseedFileFromUrl(preseed.base, log)
  }

  return false
}

/**
 * Helper method to load preseeded settings
 *
 * @param {object} preseed - The preseed settings
 * @param {object} currentSettings - The full settings
 * @param {object} log - A logger instance
 * @param {string} gitroot - Folder in which to clone git repos
 * @return {object} config - The loaded config
 */
export async function loadPreseededSettings(
  preseed = false,
  currentSettings = false,
  log,
  gitroot = '/etc/morio/shared'
) {
  if (!preseed) return currentSettings

  /*
   * If there's a git config, we need to handle that first
   */
  await ensurePreseededContent(preseed, log, gitroot)

  /*
   * Attempt to load the preseed base file (if there is one)
   * Else, start from the current settings
   */
  const settings = preseed.base
    ? await loadPreseedBaseFile(preseed, gitroot, log)
    : cloneAsPojo(currentSettings)
  if (!settings) {
    log.warn(
      preseed.base ? `Failed to load preseed base file` : `Failed to construct initial settings`
    )
    return false
  } else if (preseed.base) log.debug(`Loaded preseed base file`)

  /*
   * Load any preseed overlays
   */
  const overlays = await loadPreseedOverlays(preseed, gitroot, log)

  /*
   * Now merge overlays into base settings and return
   */
  return applyOverlays(settings, overlays, log)
}

/**
 * Helper method to ensure preseeded content is available on disk
 *
 * @param {object} preseed - The preseed settings
 * @param {object} log - A logger instance
 * @param {string} gitroot - Folder in which to clone git repos
 * @return {object} config - The loaded config
 */
export async function ensurePreseededContent(preseed, log, gitroot = '/etc/morio/shared') {
  /*
   * If there's a git config, we need to fetch it
   */
  if (preseed?.git) {
    for (const [id, config] of Object.entries(preseed.git)) {
      await loadGitRepo(gitroot, id, config, log)
    }
  }
}

/**
 * Helper method to load a preseed file from the Github API
 *
 * @param {object} config - The preseed config
 * @return {object} config - The loaded config
 */
async function loadPreseedFileFromGithub(config, log) {
  const url = `${config.github.url || 'https://api.github.com'}/repos/${
    config.github.owner
  }/${config.github.repo}/contents/${encodeURIComponent(
    config.github.file_path
  )}?ref=${config.github.ref}`
  const result = await testUrl(url, {
    returnError: true,
    ignoreCertificate: config.verify_certificate === false ? true : false,
    timeout: 4500,
    returnAs: 'json',
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: config.github.token ? `Bearer ${config.github.token}` : undefined,
    },
  })

  log.debug(`Preseeding ${url}`)

  return typeof result.content === 'string' ? asJsonOrYaml(result.content, true) : false
}

/**
 * Helper method to load a preseed file from the Gitlab API
 *
 * @param {object} config - The preseed config
 * @return {object} config - The loaded config
 */
async function loadPreseedFileFromGitlab(config, log) {
  const url = `${config.gitlab.url || 'https://gitlab.com'}/api/v4/projects/${
    config.gitlab.project_id
  }/repository/files/${encodeURIComponent(config.gitlab.file_path)}?ref=${config.gitlab.ref}`
  const result = await testUrl(url, {
    ignoreCertificate: config.verify_certificate === false ? true : false,
    timeout: 4500,
    returnAs: 'json',
    headers: config.gitlab.token ? { 'PRIVATE-TOKEN': config.gitlab.token } : undefined,
  })

  log.debug(`Preseeding ${url}`)

  return typeof result.content === 'string' ? asJsonOrYaml(result.content, true) : false
}

/**
 * Helper method to load a preseed file from a (local) git repo
 *
 * @param {object} config - The preseed file config
 * @param {object} preseed - The preseed settings
 * @param {string} gitroot - Path to the root where git repos are stored
 * @return {object} settings - The loaded settings
 */
async function loadPreseedFileFromRepo(config, preseed, gitroot, log) {
  const chunks = config.slice(4).split('@')
  const repo = chunks[1] ? chunks[1] : Object.keys(preseed.git)[0]
  const content = await readFileFromRepo(repo, chunks[0], gitroot)

  if (content) log.debug(`Preseeded ${config}`)
  else log.warn(`Failed to preseed ${config}`)

  return content ? asJsonOrYaml(content) : false
}

/**
 * Helper method to load a preseed file from a URL
 *
 * @param {object|string} config - The preseed config
 * @return {object} config - The loaded config
 */
async function loadPreseedFileFromUrl(config, log) {
  const url = typeof config === 'string' ? config : config.url
  const result = await testUrl(url, {
    ignoreCertificate: config.verify_certificate === false ? false : true,
    timeout: 4500,
    returnAs: 'json',
    headers: config.headers ? config.headers : undefined,
  })

  log.debug(`Preseeding ${url}`)

  /*
   * Handle YAML or JSON
   */
  return typeof result === 'string' ? asJsonOrYaml(result, false) : result
}

/**
 * Helper method to load a preseed overlay
 *
 * @param {object|string} overlay - The preseed settings for this overlay
 * @param {object} preseed - The preseed settings
 * @param {string} gitroot - Path to the root where git repos are stored
 * @param {object} log - The logger object
 * @return {object} settings - The loaded settings
 */
async function loadPreseedOverlay(overlay, preseed, gitroot, log) {
  if (typeof overlay === 'string') {
    if (fromRepo(overlay)) return await loadPreseedFileFromRepo(overlay, preseed, gitroot, log)
    const api = fromApi(overlay)
    if (api === 'github')
      return await loadPreseedFileFromGithub({
        github: {
          ...preseed.base.github,
          // Replace the file path, but strip out the '@github' at the end
          file_path: overlay.slice(0, -7),
        },
      })
    if (api === 'gitlab')
      return await loadPreseedFileFromGitlab({
        gitlab: {
          ...preseed.base.gitlab,
          // Replace the file path, but strip out the '@gitlab' at the end
          file_path: overlay.slice(0, -7),
        },
      })
    return await loadPreseedFileFromUrl(overlay)
  }

  if (overlay.github) return await loadPreseedFileFromGithub(overlay)
  if (overlay.gitlab) return await loadPreseedFileFromGitlab(overlay)

  return false
}

/**
 * Helper method to load the preseed overlays
 *
 * @param {object} preseed - The preseed settings
 * @param {string} gitroot - Path to the root where git repos are stored
 * @param {object} log - A logger instance
 * @return {object} settings - The loaded settings
 */
async function loadPreseedOverlays(preseed, gitroot, log) {
  const overlays = []

  if (!preseed?.overlays) return overlays

  /*
   * Handle string
   */
  if (typeof preseed.overlays === 'string') {
    /*
     * Could still be a glob for a local git repo
     */
    if (fromRepo(preseed.overlays)) {
      const repos = Object.keys(preseed.git || {})
      let repo = fromApi(preseed.overlays)
      if (!repo) repo = repos[0]
      if (!preseed?.git[repo]) {
        log.warn(`Cannot find repo to glob from: ${preseed.overlays}`)
        return false
      }
      const found = await globDataFromRepo(preseed.overlays.slice(4).split('@')[0], repo, gitroot)
      for (const overlay of found) {
        if (overlay) overlays.push(overlay)
      }
    } else {
      const overlay = await loadPreseedOverlay(preseed.overlays, preseed, gitroot, log)
      if (overlay) overlays.push(overlay)
    }
  } else if (Array.isArray(preseed.overlays)) {
    /*
     * If overlays holds an array, that array can still hold a glob pattern.
     * Rather than duplicate the logic, we call this function recursively to
     * handle each array entry individually. To make that work, we just need
     * to adapt the preseed object a bit.
     * Note that this also means we support nested arrays
     * although we don't tend to advocate for it. But it's possible.
     */
    for (const config of preseed.overlays) {
      const sublays = await loadPreseedOverlays({ ...preseed, overlays: config }, gitroot, log)
      if (sublays) overlays.push(...sublays)
    }
  }

  return overlays
}

/**
 * Helper method to read a file from a local git repo
 *
 * @param {string} id - The key in the preseed.git object
 * @param {string} path - The (path to the) file to read
 * @param {gitroot} gitroot - Folder under which git repos reside
 * @return {string} content - The file contents
 */
async function readFileFromRepo(id, path, gitroot) {
  return await readFile(`${gitroot}/${sanitizeGitFolder(id)}/${path}`)
}

/**
 * Loads a glob pattern over files from a repo
 *
 * @param {string} pattern - The glob pattern
 * @param {string} repo - The repo ID (key in the preseed.git object)
 * @param {string} gitroot - Folder holding the cloned git repos
 * @param {array} found - Found files
 */
export async function globFilesFromRepo(pattern, repo, gitroot) {
  const base = `${gitroot}/${sanitizeGitFolder(repo)}`
  const files = await globDir(`${gitroot}/${sanitizeGitFolder(repo)}`, pattern)

  return {
    base,
    files,
  }
}

/**
 * Helper method to sanitize a git folder
 *
 * @param {string} id - The key under preseed.git
 * @return {string} hash - The hashed id
 */
function sanitizeGitFolder(id) {
  return hash(id)
}

export async function loadClientModules(settings, log) {
  /*
   * Don't bother unless we have modules to load
   */
  const globs = settings?.preseed?.modules
  if (!Array.isArray(globs) || globs.length < 1) return

  /*
   * Folder inside the core container where to store the client files
   */
  const targetFolder = '/morio/clients/linux/etc/morio'

  /*
   * Create client folder structure
   */
  const folders = [
    'audit/module-templates.d',
    'audit/rule-templates.d',
    'logs/module-templates.d',
    'logs/input-templates.d',
    'metrics/module-templates.d',
  ]
  for (const folder of folders) {
    const dir = `${targetFolder}/${folder}`
    try {
      log.trace(`Removing seeded client modules: ${dir}`)
      await rm(dir, { recursive: true, force: true }) // Do not mutate, just rm and recreate
      await mkdir(dir, log)
    } catch (err) {
      log.warn(err, `Unable to create folder for client modules: ${dir}`)
    }
  }

  /*
   * Now load client modules
   */
  for (const entry of globs) {
    if (entry.slice(0, 4) === 'git:') {
      const [pattern, repo] = entry.slice(4).split('@')
      if (settings.preseed?.git?.[repo]) {
        const { files } = await globFilesFromRepo(pattern, repo, '/etc/morio/shared')
        for (const sourceFile of files) {
          const targetFile = findPreseedTarget(sourceFile, 'modules')
          if (
            targetFile &&
            (sourceFile.slice(-4) === '.yml' || sourceFile.slice(-6) === '.rules')
          ) {
            const copy = await copyPreseedFile({
              sourceFile,
              targetFile: sourceFile.slice(-4) === '.yml' ? `${targetFile}.disabled` : targetFile,
              targetFolder,
            })
            if (copy) log.debug(`Seeding client module file: ${targetFile}`)
            else log.warn(`Failed to seed client module file: ${targetFile}`)
          }
        }
      }
    }
  }

  return true
}

export async function loadStreamProcessors(settings, log) {
  /*
   * Don't bother unless we have processors to load
   */
  const globs = settings?.preseed?.processors
  if (!Array.isArray(globs) || globs.length < 1) return settings

  /*
   * Folder inside the core container where to store the client files
   */
  const targetFolder = '/morio/tap/processors'

  /*
   * Clear processors folder
   */
  const current = await globDir(targetFolder, `**`)
  for (const file of current) {
    try {
      log.trace(`Removing seeded stream processors: ${file}`)
      await rm(file, { force: true, recursive: true })
    } catch (err) {
      log.warn(err, `Failed to remove ${file}`)
    }
  }

  /*
   * Now load stream processors
   */
  for (const entry of globs) {
    if (entry.slice(0, 4) === 'git:') {
      const [pattern, repo] = entry.slice(4).split('@')
      if (settings.preseed?.git?.[repo]) {
        const { files } = await globFilesFromRepo(pattern, repo, '/etc/morio/shared')
        /*
         * By sorting the list of files, we can ensure that the main
         * file is always loaded before any modules it uses.
         */
        for (const sourceFile of files.sort()) {
          const targetFile = findPreseedTarget(sourceFile, 'processors')
          if (targetFile && sourceFile.slice(-4) === '.mjs') {
            const copy = await copyPreseedFile(
              {
                sourceFile,
                targetFile,
                targetFolder,
              },
              2112
            ) // 2112 is the user id of the user inside the tap container
            if (copy) {
              log.debug(`Seeding stream processing file: ${targetFile}`)
              /*
               * We need to dynamically load the stream processor's settings too
               * For this, we will dynamically import the file and check for the
               * named 'info' export which can hold a 'settings' key
               */
              const chunks = targetFile.split('/')
              const processor = chunks[0]
              const mod =
                chunks.length === 3 && chunks[1] === 'modules' && chunks[2].slice(-4) === '.mjs'
                  ? chunks[2].slice(0, -4)
                  : false
              const load = await import(sourceFile)
              /*
               * Is it a stream processor module?
               * And if so, does it expose any settings?
               */
              if (mod && mod !== 'index' && load.info?.settings) {
                setIfUnset(settings, ['tap', processor, 'modules', mod], {})
                settings.tap[processor].modules[mod] = ensureStreamProcessorSettings(
                  load.info?.settings,
                  settings.tap[processor].modules[mod]
                )
              } else {
                /*
                 * Or is it a stream processor itself?
                 * (these should always have settings)
                 */
                setIfUnset(settings, ['tap', processor], {})
                settings.tap[processor] = ensureStreamProcessorSettings(
                  load.info?.settings,
                  settings.tap[processor]
                )
                // Enabled is implied  unless explicitly disabled
                setIfUnset(settings, ['tap', processor, 'enabled'], true)
              }
            } else log.warn(`Failed to seed stream processing file: ${targetFile}`)
          }
        }
      }
    }
  }

  return settings
}

function ensureStreamProcessorSettings(seededSettings = {}, morioSettings) {
  for (const [key, val] of Object.entries(seededSettings)) {
    if (['enabled', 'topics'].includes(key) && typeof val !== 'undefined') {
      // These two fields take a simple value
      setIfUnset(morioSettings, key, val)
    } else if (typeof val.dflt !== 'undefined') {
      // These take a UI config object, with the default value stored in the `dflt` key
      setIfUnset(morioSettings, key, val.dflt)
    }
  }

  return morioSettings
}

export async function loadChartProcessors(settings, log) {
  /*
   * Don't bother unless we have charts to load
   */
  const globs = settings?.preseed?.charts
  if (!Array.isArray(globs) || globs.length < 1) return settings

  /*
   * Folder inside the core container where to store the chart files
   */
  const targetFolder = '/etc/morio/shared/charts'

  /*
   * Clear charts folder
   */
  const current = await globDir(targetFolder, `**`)
  for (const file of current) {
    try {
      log.trace(`Removing chart processors: ${file}`)
      await rm(file, { force: true, recursive: true })
    } catch (err) {
      log.warn(err, `Failed to remove ${file}`)
    }
  }

  /*
   * Now load chart processors
   */
  for (const entry of globs) {
    if (entry.slice(0, 4) === 'git:') {
      const [pattern, repo] = entry.slice(4).split('@')
      if (settings.preseed?.git?.[repo]) {
        const { files } = await globFilesFromRepo(pattern, repo, '/etc/morio/shared')
        // For now, we only support metrics
        const metrics = {}
        for (const sourceFile of files.sort()) {
          const relFile = sourceFile.slice(`/etc/morio/shared/${sanitizeGitFolder(repo)}/`.length)
          const [file = false, type = false] = relFile.split('/').reverse()
          if (file.slice(-4) === '.mjs' && type === 'metrics') {
            const module = file.slice(0, -4)
            try {
              // Import file dynamically
              const esm = await import(sourceFile)
              if (esm && typeof esm.default === 'object') metrics[module] = esm.default
            } catch (err) {
              log.warn(`Failed to load chart transformer: ${sourceFile}. ${err}`)
            }
          }
        }
        // Make it serializable
        const js = {}
        for (const [module, metricsets] of Object.entries(metrics)) {
          for (const [metricset, method] of Object.entries(metricsets)) {
            if (typeof js[module] === 'undefined') js[module] = {}
            if (typeof method === 'function') js[module][metricset] = method.toString()
          }
        }
        // Write to disk
        if (Object.keys(js).length > 0) {
          await mkdir(targetFolder)
          await writeFile(`${targetFolder}/metrics.mjs`, convertToChartFile(js), log, '00775')
        }
      }
    }
  }

  return
}

function convertToChartFile(code) {
  let output = `window.morio = window.morio || {}
window.morio.charts = window.morio.charts || {}
window.morio.charts.metrics = {`
  for (const [module, metricsets] of Object.entries(code)) {
    output += `\n  "${module}": {`
    for (const [metricset, method] of Object.entries(metricsets)) {
      output += `\n    "${metricset}": ${method.split('\n').join('\n  ')},`
    }
    output += '\n  }'
  }
  output += '\n}'

  return output
}

async function copyPreseedFile({ sourceFile, targetFile, targetFolder }, chownId = false) {
  try {
    await mkdir(targetFolder)
    if (chownId) await fs.promises.chown(targetFolder, chownId, chownId)
    await fs.promises.cp(sourceFile, `${targetFolder}/${targetFile}`)
    if (chownId) await fs.promises.chown(`${targetFolder}/${targetFile}`, chownId, chownId)
  } catch (err) {
    console.log(err)
    return false
  }

  return true
}

function findPreseedTarget(file, root) {
  const start = reverseString(file).indexOf(`/${reverseString(root)}/`)
  if (start === -1) return false
  else return file.slice(-1 * start)
}

function applyOverlays(settings, overlays, log) {
  const count = overlays.length
  let i = 0
  for (const overlay of overlays) {
    i++
    log.debug(`Applying overlay ${i}/${count}`)
    settings = applyOverlay(settings, overlay)
  }

  return settings
}

/*
 * This function applies an overlay to the settings and returns them
 *
 * Overlays can contain 6 different keys, which are used to mutate the config.
 * They are:
 * - merge: Soft-set a key in the settings object
 * - ensure: Soft-add an element to an array in the settings object
 * - push: Hard-add an element to an array in the settings object
 * - drop: Hard-remove an element from an array in the settings object
 * - set: Hard-set a key in the settings object
 * - unset: Hard-unset a key in the settings object
 *
 * So we have 3 methods: soft-add, hard-add, and (hard-)remove
 * and this both for objects and arrays.
 *
 * @param {object} settings - The settings object to mutate
 * @param {object} overlay - The overlay to apply
 * @return {object} settings - The mutated settings
 */
function applyOverlay(settings, overlay = {}) {
  // Merge goes first, this is the soft add for methods
  if (overlay.merge) {
    const todo = Array.isArray(overlay.merge) ? [...overlay.merge] : [overlay.merge]
    for (const item of todo) {
      settings = merge({}, item, settings)
    }
  }
  // Then we have the soft array method
  if (overlay.ensure) {
    for (const [path, val] of Object.entries(overlay.ensure)) {
      const current = get(settings, path, [])
      if (!current.includes(val)) set(settings, path, [...current, val])
    }
  }
  // Then the hard array method to add
  if (overlay.push) {
    for (const [path, val] of Object.entries(overlay.ensure)) {
      const current = get(settings, path, [])
      set(settings, path, [...current, val])
    }
  }
  // Then the hard array method to remove
  if (overlay.drop) {
    for (const [path, val] of Object.entries(overlay.ensure)) {
      const current = get(settings, path, false)
      if (Array.isArray(current) && current.includes(val)) {
        set(
          settings,
          path,
          current.filter((item) => item !== val)
        )
      }
    }
  }
  // Set goes second to last, hard method to add
  if (overlay.set) {
    for (const [path, value] of Object.entries(overlay.set)) {
      set(settings, path, value)
    }
  }
  // Unset goes last, hard method to remove
  if (overlay.unset) {
    for (const [path, value] of Object.entries(overlay.unset)) {
      unset(settings, path, value)
    }
  }

  return settings
}
