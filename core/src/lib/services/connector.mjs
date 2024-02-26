import { readYamlFile, readDirectory, writeFile, writeYamlFile, chown, mkdir } from '#shared/fs'
import { extname, basename } from 'node:path'

export const wanted = () => false

/**
 * Service object holds the various lifecycle hook methods
 */
export const service = {
  name: 'connector',
  hooks: {
    wanted: async (tools) => {
      if (tools.config?.connector?.pipelines) {
        if (
          Object.values(tools.config.connector.pipelines).filter((pipe) => !pipe.disabled).length >
          0
        )
          return true
      }

      return false
    },
    /*
     * Before creating the container, write out the logstash.yml file
     * This will be volume-mapped, so we need to write it to
     * disk first so it's available
     */
    preCreate: async (tools) => {
      /*
       * See if logstash.yml on the host OS is present
       */
      const file = '/etc/morio/connector/config/logstash.yml'
      const config = await readYamlFile(file)
      if (config && false === 'fixme') {
        tools.log.debug('Connector: Config file exists, no action needed')
      } else {
        tools.log.debug('Connector: Creating config file')
        await writeYamlFile(file, tools.config.services.connector.logstash, tools.log, 0o644)
      }

      /*
       * Make sure the data directory exists, and is writable
       */
      const uid = tools.getPreset('MORIO_CONNECTOR_UID')
      await mkdir('/morio/data/connector')
      await chown('/morio/data/connector', uid, uid)

      /*
       * Make sure the pipelines directory exists, and is writable
       */
      await mkdir('/etc/morio/connector/pipelines')
      await chown('/etc/morio/connector/pipelines', uid, uid)

      return true
    },
    preStart: async (tools) => {
      /*
       * Need to write out pipelines, but also remove any that
       * may no longer be there, so we first need to load all
       * pipelines that are on disk
       */
      const currentPipelines = await loadPipelinesFromDisk()
      const wantedPipelines = (Object.keys(tools.settings.connector?.pipelines) || []).filter(
        (id) => {
          if (!tools.settings?.connector?.pipelines?.[id]) return false
          if (tools.settings?.connector?.pipelines?.[id].disabled) return false
          return true
        }
      )

      await createWantedPipelines(wantedPipelines, tools)
      await removeUnwantedPipelines(currentPipelines, wantedPipelines, tools)

      return true
    },
  },
}

const loadPipelinesFromDisk = async () =>
  ((await readDirectory(`/etc/morio/connector/pipelines`)) || [])
    .filter((file) => extname(file) === '.config')
    .map((file) => basename(file).slice(0, -7))
    .sort()

const pipelineFilename = (id) => `${id}.config`

const createWantedPipelines = async (wantedPipelines, tools) => {
  const pipelines = []
  for (const id of wantedPipelines) {
    const config = generatePipelineConfiguration(tools.settings.connector.pipelines[id], tools)
    if (config) {
      const file = pipelineFilename(id)
      await writeFile(`/etc/morio/connector/pipelines/${file}`, config, tools.log)
      tools.log.debug(`Created connector pipeline ${id}`)
      pipelines.push({
        'pipeline.id': id,
        'path.config': `/usr/share/logstash/pipeline/${file}`,
      })
    }
  }
  await writeYamlFile(`/etc/morio/connector/config/pipelines.yml`, pipelines, tools.log)
}

const removeUnwantedPipelines = async (currentPipelines, wantedPipelines, tools) => {
  for (const id of currentPipelines) {
    if (!wantedPipelines.includes(id)) {
      tools.log.debug(`FIXME: Remove connector pipeline ${id}`)
    }
  }
}

const generatePipelineConfiguration = (pipeline, tools) => {
  const input = tools.settings.connector?.inputs?.[pipeline.input.id] || false
  const output = tools.settings.connector?.outputs?.[pipeline.output.id] || false

  if (!input || !output) return false

  return `# This pipeline configuration is auto-generated by Morio core
# Any changes you make to this file will be overwritten
${generateXputConfig(input, pipeline, 'input', tools)}
${generateXputConfig(output, pipeline, 'output', tools)}
`
}

const generateXputConfig = (xput, pipeline, type, tools) => `
# ${type === 'input' ? 'Input' : 'Output'}, aka where to ${type === 'input' ? 'read data from' : 'write data to'}
${type} {
  ${xput.plugin} { ${generatePipelinePluginConfig(xput.plugin, xput, pipeline, type, tools)}  }
}
`

const generatePipelinePluginConfig = (plugin, xput, pipeline, type) => {
  let config = ''
  for (const [key, val] of Object.entries(xput)) {
    if (!['id', 'type', 'plugin', 'about'].includes(key)) {
      config += `\n    ${key} => ${JSON.stringify(val)}`
    }
  }

  if (pipeline && type === 'output') {
    if (plugin === 'morio_local') {
      config += `\n    topic => ${JSON.stringify(pipeline.output.topic)}`
    }
  }

  return config + '\n'
}
