import { readDirectory, writeFile, writeYamlFile, rm } from '#shared/fs'
import { extname, basename } from 'node:path'
import orderBy from 'lodash/orderBy.js'
// log & utils
import { log, utils } from '../utils.mjs'
import { nl } from './lib.mjs'
// inputs and outputs
import { elasticsearchOutput } from './elasticsearch.mjs'
import { httpOutput } from './http.mjs'
import { localMorioInput, localMorioOutput } from './morio.mjs'
import { rssInput, rssOutput } from './rss.mjs'
import { sinkOutput } from './sink.mjs'
import { lsclInput, lsclOutput, lsclFilter } from './lscl.mjs'
/*
 * Bundle inputs and outputs
 */
const logstash = {
  input: {
    lscl: lsclInput,
    morio_local: localMorioInput,
    rss: rssInput,
  },
  filter: {
    lscl: lsclFilter,
  },
  output: {
    elasticsearch: elasticsearchOutput,
    http: httpOutput,
    lscl: lsclOutput,
    morio_local: localMorioOutput,
    rss: rssOutput,
    sink: sinkOutput,
  },
}

/**
 * This method ensures pipelines as the way we want them
 */
export async function ensurePipelines() {
  const currentPipelines = await loadPipelinesFromDisk()
  const wantedPipelines = Object.keys(utils.getSettings('connector.pipelines', {})).filter((id) => {
    if (!utils.getSettings(['connector', 'pipelines', id], false)) return false
    if (utils.getSettings(['connector', 'pipelines', id, 'disabled'], false)) return false
    return true
  })

  await createWantedPipelines(wantedPipelines)
  await removeUnwantedPipelines(currentPipelines, wantedPipelines)

  return true
}

/**
 * Helper method to load a list of all pipeline configurations from disk
 *
 * @return {Array} list - A list of filenames
 */
async function loadPipelinesFromDisk() {
  return ((await readDirectory(utils.getPreset('MORIO_CORE_LOGSTASH_PIPELINES_FOLDER'))) || [])
    .filter((file) => extname(file) === '.config')
    .map((file) => basename(file).slice(0, -7))
    .sort()
}

/**
 * Helper method to generate the pipeline configuration filename
 *
 * @return {string} filename - The filename for the configuration
 */
function pipelineFilename(id) {
  return `${id}.config`
}

/*
 * Helper method to create the pipelines wanted by the user
 *
 * @param {Array} wantedPipelines - List of pipelines wanted by the user
 */
async function createWantedPipelines(wantedPipelines) {
  const pipelines = []
  for (const id of wantedPipelines) {
    try {
      const config = await generatePipelineConfiguration(
        utils.getSettings(['connector', 'pipelines', id]),
        id
      )
      if (config) {
        const file = pipelineFilename(id)
        await writeFile(
          `${utils.getPreset('MORIO_CORE_LOGSTASH_PIPELINES_FOLDER')}/${file}`,
          config,
          log
        )
        log.debug(`Created connector pipeline ${id}`)
        pipelines.push({
          'pipeline.id': id,
          'path.config': `${utils.getPreset('MORIO_CONNECTOR_LOGSTAHS_PIPELINE_FOLDER')}/${file}`,
        })
      }
    } catch (err) {
      return log.error(
        err,
        `Failed to generated logstash pipeline with ID ${id}. The pipeline will not be active.`
      )
    }
  }
  await writeYamlFile(
    utils.getPreset('MORIO_CONNECTOR_LOGSTASH_PIPELINE_CONFIG_FILE'),
    pipelines,
    log
  )
}

/**
 * Helper method to remove pipeline configurations files from disk
 *
 * When you create a pipeline, and then remove it later, this will
 * garbage-collect its configuration file
 *
 * @param {Array} currentPipelines - List of pipelines currently on disk
 * @param {Array} wantedPipelines - List of pipelines wanted by the user
 */
async function removeUnwantedPipelines(currentPipelines, wantedPipelines) {
  for (const id of currentPipelines) {
    if (!wantedPipelines.includes(id)) {
      log.debug(`Removing pipeline: ${id}`)
      await rm(`${utils.getPreset('MORIO_CORE_LOGSTASH_PIPELINES_FOLDER')}/${id}.config`)
    }
  }
}

/**
 * Helper method to generate a Logstash pipeline configuration
 *
 * @param {object} pipeline - The pipeline configuration
 * @param {string} pipelineId - The pipeline ID
 * @return {string} config - The generated pipeline configuration
 */
async function generatePipelineConfiguration(pipeline, pipelineId) {
  /*
   * LSCL pipelines need no parsing
   */
  if (pipeline.lscl) return pipeline.lscl

  const input = utils.getSettings(['connector', 'inputs', pipeline.input.id], false)
  if (!input) return false
  const output = utils.getSettings(['connector', 'outputs', pipeline.output.id], false)
  if (!output) return false

  const inputLscl = await generateXputConfig(input, pipeline, pipelineId, 'input')
  const filterLscl = await generateFilterConfig(pipeline, pipelineId)
  const outputLscl = await generateXputConfig(output, pipeline, pipelineId, 'output')

  return `# This pipeline configuration is auto-generated by Morio core
# Any changes you make to this file will be overwritten
${inputLscl}
${filterLscl}
${outputLscl}
`
}

/**
 * Generates an input or output (xput) configuration for Logstash
 *
 * @param {object} xput - the xput configuration
 * @param {object} pipeline - the pipeline configuration
 * @param {string} pipelineId - the pipeline ID
 * @param {string} type - One of input our output
 * @return {string} lscl - the LSCL code
 */
async function generateXputConfig(xput, pipeline, pipelineId, type) {
  return typeof logstash[type]?.[xput.plugin] === 'function'
    ? await logstash[type][xput.plugin](xput, pipeline, pipelineId)
    : `${nl}${nl}#${nl}# A ${type} plugin of type ${xput?.plugin} is not supported${nl}#${nl}`
}

/**
 * Generates a filter configuration for Logstash
 *
 * @param {object} pipeline - the pipeline configuration
 * @param {string} pipelineId - the pipeline ID
 * @return {string} lscl - the LSCL code
 */
async function generateFilterConfig(pipeline, pipelineId) {
  let lscl = ''
  /*
   * OrderBy will strip the id, so we need to inject it
   */
  const filters = {}
  for (const id of Object.keys(pipeline.filters || {}))
    filters[id] = { ...pipeline.filters[id], id }

  for (const { id } of orderBy(filters, 'order', 'ASC')) {
    const filter = utils.getSettings(['connector', 'filters', id])
    lscl +=
      typeof logstash.filter[filter.plugin] === 'function'
        ? logstash.filter[filter.plugin](filter, pipeline, pipelineId)
        : `${nl}${nl}#${nl}# A filter of plugin type ${filter.plugin} is not supported${nl}#${nl}`
  }

  return lscl
}
