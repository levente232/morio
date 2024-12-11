import { useState, useContext } from 'react'
import { Markdown } from 'components/markdown.mjs'
import { AmazonCloudWatch, Azure, Elasticsearch, Kafka } from 'components/brands.mjs'
import orderBy from 'lodash/orderBy.js'
import unset from 'lodash/unset.js'
// Templates
import { connector as connectorTemplates } from '../templates/connector/index.mjs'
import {
  CodeIcon,
  DocumentIcon,
  EmailIcon,
  HttpIcon,
  InputIcon,
  FilterIcon,
  MorioIcon,
  OutputIcon,
  PuzzleIcon,
  RightIcon,
  RssIcon,
  SparklesIcon,
  TrashIcon,
} from 'components/icons.mjs'
import { ModalContext } from 'context/modal.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { Popout } from 'components/popout.mjs'
import Joi from 'joi'
import set from 'lodash/set.js'
import { FormWrapper, loadFormDefaults } from './form.mjs'
import { slugify } from 'lib/utils.mjs'
import { reduceFormValidation } from './form.mjs'
import { MaxWidthWrapper } from './utils.mjs'

const brandProps = { fill: 1, stroke: 0, className: 'w-8 h-8' }
const iconProps = { fill: 0, stroke: 1.5, className: 'w-8 h-8' }

const brands = {
  amazon_cloudwatch: <AmazonCloudWatch {...brandProps} />,
  azure_event_hubs: <Azure {...brandProps} />,
  lscl: <CodeIcon {...iconProps} />,
  elasticsearch: <Elasticsearch {...brandProps} />,
  http: <HttpIcon {...brandProps} />,
  http_poller: <HttpIcon {...brandProps} />,
  imap: <EmailIcon {...iconProps} />,
  generator: <SparklesIcon {...iconProps} />,
  kafka: <Kafka {...brandProps} />,
  morio: <MorioIcon {...brandProps} />,
  morio_remote: <MorioIcon {...brandProps} />,
  morio_local: <MorioIcon {...brandProps} />,
  rss: <RssIcon {...iconProps} stroke={2} />,
  sink: <TrashIcon {...iconProps} />,
}

const XputHeader = ({ id, title, type }) => (
  <h3 className="flex flex-row justify-between items-center w-full">
    {brands[id] ? brands[id] : <InputIcon {...iconProps} />}
    <span>
      <b>{title ? title : type}</b> {type}
    </span>
    {type === 'input' ? (
      <InputIcon className="w-12 h-12" stroke={1.25} />
    ) : (
      <OutputIcon className="w-12 h-12" stroke={1.25} />
    )}
  </h3>
)

const AddXput = (props) => {
  const defaults = loadFormDefaults(
    {
      plugin: props.id,
      type: props.type,
    },
    props.form
  )

  return (
    <MaxWidthWrapper>
      <XputHeader id={props.id} title={props.title} type={props.type} />
      {props.form ? (
        <FormWrapper {...props} defaults={defaults} action="create" />
      ) : (
        <p>No form for this type of connector</p>
      )}
    </MaxWidthWrapper>
  )
}

const xputPipelineList = (id, type, data) => {
  if (!data.connector.pipelines) return false
  const list = []
  for (const [pipelineId, config] of Object.entries(data.connector.pipelines)) {
    if (config[type]?.id === id) list.push(pipelineId)
  }

  return list.length > 0 ? list : false
}

const UpdateXput = (props) => {
  const templates = connectorTemplates({ mSettings: props.data, update: props.update })
  const formProps = templates.children?.[props.type + 's']?.blocks?.[props.plugin]
  const formData = props.data?.connector?.[props.type + 's']?.[props.id] || {}
  const defaults = loadFormDefaults(
    {
      plugin: props.id,
      type: props.type,
    },
    formProps?.form
  )

  const removeLocal = props.pipelines
    ? false
    : () => {
        props.update(`connector.inputs.${props.id}`, 'MORIO_UNSET')
        props.popModal()
      }

  if (formProps)
    return (
      <MaxWidthWrapper>
        <XputHeader id={props.plugin} title={props.id} type={props.type} action="update" />
        <FormWrapper
          {...props}
          {...formProps}
          removeLocal={removeLocal}
          defaults={{ ...defaults, ...formData }}
          action="update"
        />
        {props.pipelines ? (
          <Popout note>
            <b>
              The <em>{props.id}</em> {props.type} is used in the following pipelines:
            </b>
            <ul className="list list-inside list-disc ml-4">
              {props.pipelines.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
            <small>
              You cannot remove an {props.type} that is in use. You need to remove the pipeline
              first.
            </small>
          </Popout>
        ) : null}
      </MaxWidthWrapper>
    )

  return (
    <MaxWidthWrapper>
      <XputHeader id={props.id} title={props.title} type={props.type} />
      <Popout note compact noP>
        The <b>{props.title}</b> {props.type} does not require any configuration
      </Popout>
    </MaxWidthWrapper>
  )
}

const XputButton = ({ title, about, id, onClick, plugin = false, pipelines = false }) => (
  <div className="indicator w-full">
    {pipelines.length > 0 ? (
      <span className="indicator-item badge badge-success mr-6">{pipelines.length}</span>
    ) : null}
    <button
      className={`rounded-lg p-0 px-2 shadow hover:bg-secondary hover:bg-opacity-20 hover:cursor-pointer w-full
        flex flex-row gap-0 items-center
        ${pipelines ? 'bg-success bg-opacity-20' : ''}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-start justify-between p-2 grow text-left">
        <span className="capitalize text-lg font-bold">{title ? title : id}</span>
        <span className="-mt-1 text-sm italic opacity-80">{about}</span>
      </div>
      <div>
        {brands[id] ? brands[id] : brands[plugin] ? brands[plugin] : <InputIcon {...iconProps} />}
      </div>
    </button>
  </div>
)

const BlockItems = (props) => {
  const { blocks, type, data } = props
  const { pushModal, popModal } = useContext(ModalContext)

  const allXputs = { ...blocks, ...(data?.connector?.[type + 's'] || {}) }

  return (
    <>
      {Object.keys(allXputs).filter(
        (id) => allXputs[id].desc === undefined || allXputs[id].about === undefined
      ).length > 0 ? (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {Object.keys(allXputs)
            .filter((id) => allXputs[id].desc === undefined || allXputs[id].about === undefined)
            .map((id) => {
              const pipelines = xputPipelineList(id, type, props.data)

              return (
                <XputButton
                  available
                  key={id}
                  {...{ id, type, pipelines }}
                  {...allXputs[id]}
                  onClick={() =>
                    pushModal(
                      <ModalWrapper keepOpenOnClick wClass="max-w-4xl w-full">
                        <UpdateXput
                          {...props}
                          {...{ type, id, pushModal, popModal, pipelines }}
                          {...allXputs[id]}
                        />
                      </ModalWrapper>
                    )
                  }
                />
              )
            })}
        </div>
      ) : null}
      <h4 className="mt-4 capitalize">Add a Connector {type}</h4>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {Object.keys(blocks)
          .filter((id) => typeof blocks[id].desc !== 'undefined')
          .map((id) => (
            <XputButton
              key={id}
              {...{ id, type }}
              {...blocks[id]}
              onClick={() =>
                pushModal(
                  <ModalWrapper keepOpenOnClick wClass="max-w-4xl w-full">
                    <AddXput {...props} {...{ type, id, pushModal, popModal }} {...blocks[id]} />
                  </ModalWrapper>
                )
              }
            />
          ))}
      </div>
    </>
  )
}

export const ConnectorXputs = (props) => (
  <>
    <h3>{props.viewConfig.title ? props.viewConfig.title : props.viewConfig.label}</h3>
    <Markdown>{props.viewConfig.about}</Markdown>
    <BlockItems blocks={props.viewConfig.blocks} type={props.type} {...props} />
  </>
)
export const ConnectorInputs = (props) => <ConnectorXputs {...props} type="input" />
export const ConnectorFilters = (props) => <ConnectorXputs {...props} type="filter" />
export const ConnectorOutputs = (props) => <ConnectorXputs {...props} type="output" />

const PipelineHeader = ({ id }) => (
  <h3 className="flex flex-row justify-between items-center w-full">
    <InputIcon className="w-12 h-12" stroke={1.25} />
    Pipeline {id}
    <OutputIcon className="w-12 h-12" stroke={1.25} />
  </h3>
)

const PipelineConnectors = ({ pipelineSettings, data, localUpdate }) => {
  const btnClasses = 'btn btn-sm w-full flex flex-row justify-between items-center'

  /*
   * We use orderBy() to sort the different filters
   * but in doing so we lose the ID so we add it as a property here
   */
  const filters = {}
  for (const id of Object.keys(pipelineSettings.filters || {})) {
    filters[id] = { id, ...pipelineSettings.filters[id] }
  }
  const filterOrder = orderBy(filters, 'order', 'asc')

  return (
    <>
      <div className="flex flex-row justify-center items-center w-full gap-4">
        <button
          className={`btn btn-ghost btn-sm btn-primary italic ${
            pipelineSettings.input?.id ? 'text-success hover:text-error' : 'opacity-70'
          }`}
          onClick={() => localUpdate('input.id', null)}
        >
          {pipelineSettings.input?.id || 'Select an input below'}
        </button>
        <div className="col-span-1 flex flex-row gap-1 items-center justify-center">
          <RightIcon className="h-5 w-5" />
          <RightIcon className="h-5 w-5 -ml-4" />
          <RightIcon className="h-5 w-5 -ml-4" />
        </div>
        <div className="flex flex-col items-center my-4 w-1/3">
          {filterOrder.map(({ id=false }, i) => id ? [
              i > 10 ? <RightIcon key="icon" className="rotate-90 w-4 h-4" stroke="3"/> : null,
              <button key="btn"
                className={`w-full btn btn-sm btn-ghost btn-primary italic flex flex-row items-center justify-between ${
                  pipelineSettings.filters?.[id] ? 'text-success hover:text-error' : 'opacity-70'
                }`}
                onClick={() => localUpdate(['filters', id], undefined)}
              >
                <FilterIcon className="w-5 h-5" />
                {id}
                <FilterIcon className="w-5 h-5" />
              </button>
            ] : null
          )}
        </div>
        <div className="col-span-1 flex flex-row gap-1 items-end justify-center">
          <RightIcon className="h-5 w-5" />
          <RightIcon className="h-5 w-5 -ml-4" />
          <RightIcon className="h-5 w-5 -ml-4" />
        </div>
        <button
          className={`btn btn-ghost btn-primary italic ${
            pipelineSettings.output?.id ? 'text-success hover:text-error' : 'opacity-70'
          }`}
          onClick={() => localUpdate('output.id', null)}
        >
          {pipelineSettings.output?.id || 'Select an output below'}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <h4>Pipeline Inputs</h4>
          {Object.keys(data?.connector?.inputs || {}).map((id) => (
            <button
              className={`${btnClasses} ${
                pipelineSettings.input?.id === id ? 'btn-success' : 'btn-neutral btn-outline'
              }`}
              onClick={() => localUpdate('input.id', id)}
              key={id}
            >
              {id}
              <InputIcon stroke={1.5} className="w-8 h-8" />
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <h4>Pipeline Filters</h4>
          {Object.keys(data?.connector?.filters || {}).map((id) => (
            <button
              className={`${btnClasses} ${
                pipelineSettings.filters?.[id] ? 'btn-success' : 'btn-neutral btn-outline'
              }`}
              onClick={() => localUpdate(['filters', id], { order: Date.now() })}
              key={id}
            >
              <FilterIcon className="w-5 h-5" />
              {id}
              <FilterIcon className="w-5 h-5" />
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          <h4>Pipeline Outputs</h4>
          {Object.keys(data?.connector?.outputs || {}).map((id) => (
            <button
              className={`${btnClasses} ${
                pipelineSettings.output?.id === id ? 'btn-success' : 'btn-neutral btn-outline'
              }`}
              onClick={() => localUpdate('output.id', id)}
              key={id}
            >
              <OutputIcon stroke={1.5} className="w-8 h-8" />
              {id}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

const WritePipeline = (props) => {
  const [pipelineSettings, setPipelineSettings] = useState(props.edit ? props.settings : {})

  const create = () => {
    // Keep the id out of the settings as the key will be the id
    const settings = { ...pipelineSettings }
    delete settings.id
    props.update(`connector.pipelines.${pipelineSettings.id}`, settings, props.data)
    props.popModal()
  }
  const remove = (id) => {
    props.update(`connector.pipelines.${id}`, 'MORIO_UNSET', props.data)
    props.popModal()
  }
  const localUpdate = (key, val) => {
    const newSettings = { ...pipelineSettings }
    set(newSettings, key, val)
    setPipelineSettings(newSettings)
  }

  const form = [
    {
      tabs: {
        Metadata: [
          {
            schema: Joi.string().required().label('ID'),
            update: (val) => localUpdate('id', slugify(val)),
            current: pipelineSettings?.id,
            placeholder: 'my-pipeline',
            label: 'ID',
            labelBL: 'A unique ID to reference this pipeline',
            labelBR: <span className="italic opacity-70">Input will be slugified</span>,
            key: 'id',
            disabled: props.edit,
            transform: slugify,
          },
          {
            schema: Joi.string().optional().allow('').label('Description'),
            epdate: (val) => localUpdate('about', val),
            label: 'Description',
            labelBL: 'A description to help understand the purpose of this pipeline',
            labelBR: <span className="italic opacity-70">Optional</span>,
            key: 'about',
            current: pipelineSettings?.about,
            inputType: 'textarea',
          },
        ],
        LSCL: [
          <Popout tip key="tip">
            <b>LSCL</b> is the <b>L</b>og<b>S</b>tash <b>C</b>onfiguration <b>L</b>anguage. It is
            unfortunately{' '}
            <a href="https://discuss.elastic.co/t/is-lscl-documented/353178/2" target="_BLANK">
              undocumented
            </a>
            , but if you are familiar with it or if you have an existing Logstash pipeline you want
            to re-use to Morio, you can include it below.
          </Popout>,
          {
            schema: Joi.string().required().label('lscl'),
            update: (val) => localUpdate('lscl', val),
            current: pipelineSettings?.lscl,
            placeholder: `input {
  rss {
    interval => 3600
    id => "example_feed"
    url => "https://morio.it/blog/rss.xml"
  }
}

output {
  sink {
    id => "example_trash"
  }
}`,
            label: 'ID',
            labelBL: 'Your pipeline config',
            key: 'lscl',
            inputType: 'textarea',
            code: true,
          },
        ],
      },
    },
  ]
  const valid = reduceFormValidation(form, pipelineSettings)

  return (
    <MaxWidthWrapper>
      <PipelineHeader id={props.id} />
      <FormWrapper {...props} form={form} update={localUpdate} />
      <div className="mt-2 flex flex-row gap-2 items-center justify-center">
        {props.edit ? (
          <button
            className={`btn btn-outline ${
              pipelineSettings.disabled ? 'btn-success' : 'btn-warning'
            }`}
            onClick={() => localUpdate('disabled', pipelineSettings.disabled ? false : true)}
          >
            {pipelineSettings.disabled ? 'Enable Pipeline' : 'Disable Pipeline'}
          </button>
        ) : null}
        <button className="btn btn-primary px-12" onClick={create} disabled={!valid}>
          {props.edit ? 'Update' : 'Create'} Pipeline
        </button>
        {props.edit ? (
          <button className="btn btn-error" onClick={() => remove(props.id)}>
            <TrashIcon />
          </button>
        ) : null}
      </div>
    </MaxWidthWrapper>
  )
}

const BuildPipeline = (props) => {
  const [pipelineSettings, setPipelineSettings] = useState(props.edit ? props.settings : {})

  const templates = connectorTemplates({
    mSettings: props.data,
    update: props.update,
    pipelineSettings,
  })

  const create = () => {
    // Keep the id out of the settings as the key will be the id
    const settings = { ...pipelineSettings }
    delete settings.id
    props.update(`connector.pipelines.${pipelineSettings.id}`, settings, props.data)
    props.popModal()
  }
  const remove = (id) => {
    props.update(`connector.pipelines.${id}`, 'MORIO_UNSET', props.data)
    props.popModal()
  }
  const localUpdate = (key, val) => {
    const newSettings = { ...pipelineSettings }
    if (val === undefined) unset(newSettings, key)
    else set(newSettings, key, val)
    setPipelineSettings(newSettings)
  }
  const inputPlugin = props.data?.connector?.inputs?.[pipelineSettings.input?.id]?.plugin
  const outputPlugin = props.data?.connector?.outputs?.[pipelineSettings.output?.id]?.plugin

  const form = [
    {
      tabs: {
        Connectors: [
          <PipelineConnectors key="pc" data={props.data} {...{ pipelineSettings, localUpdate }} />,
        ],
        Metadata: [
          {
            schema: Joi.string().required().label('ID'),
            update: (val) => localUpdate('id', slugify(val)),
            current: pipelineSettings?.id,
            placeholder: 'my-pipeline',
            label: 'ID',
            labelBL: 'A unique ID to reference this pipeline',
            labelBR: <span className="italic opacity-70">Input will be slugified</span>,
            key: 'id',
            disabled: props.edit,
            transform: slugify,
          },
          {
            schema: Joi.string().optional().allow('').label('Description'),
            epdate: (val) => localUpdate('about', val),
            label: 'Description',
            labelBL: 'A description to help understand the purpose of this pipeline',
            labelBR: <span className="italic opacity-70">Optional</span>,
            key: 'about',
            current: pipelineSettings?.about,
            inputType: 'textarea',
          },
        ],
        'Input Settings': templates.children.inputs.blocks?.[inputPlugin]?.pipeline_form ? (
          templates.children.inputs.blocks?.[inputPlugin]?.pipeline_form({
            update: localUpdate,
            data: pipelineSettings,
          })
        ) : (
          <p className="text-center font-bold italic opacity-70">
            This input requires no pipeline-specific configuration
          </p>
        ),
        'Output Settings': templates.children.outputs.blocks?.[outputPlugin]?.pipeline_form ? (
          templates.children.outputs.blocks?.[outputPlugin]?.pipeline_form({
            update: localUpdate,
            data: pipelineSettings,
          })
        ) : (
          <p className="text-center font-bold italic opacity-70">
            This output requires no pipeline-specific configuration
          </p>
        ),
      },
    },
  ]
  const valid = reduceFormValidation(form, pipelineSettings)

  return (
    <MaxWidthWrapper>
      <PipelineHeader id={props.id} />
      <FormWrapper {...props} form={form} update={localUpdate} />
      <div className="mt-2 flex flex-row gap-2 items-center justify-center">
        {props.edit ? (
          <button
            className={`btn btn-outline ${
              pipelineSettings.disabled ? 'btn-success' : 'btn-warning'
            }`}
            onClick={() => localUpdate('disabled', pipelineSettings.disabled ? false : true)}
          >
            {pipelineSettings.disabled ? 'Enable Pipeline' : 'Disable Pipeline'}
          </button>
        ) : null}
        <button className="btn btn-primary px-12" onClick={create} disabled={!valid}>
          {props.edit ? 'Update' : 'Create'} Pipeline
        </button>
        {props.edit ? (
          <button className="btn btn-error" onClick={() => remove(props.id)}>
            <TrashIcon />
          </button>
        ) : null}
      </div>
    </MaxWidthWrapper>
  )
}

const ShowPipeline = (props) => {
  const pipeline = props.data.connector.pipelines[props.id]

  const lscl = pipeline.lscl ? true : false

  return (
    <button
      className={`max-w-4xl w-full grid grid-cols-3 gap-2 items-center
         border rounded-lg mb-2 hover:bg-secondary hover:bg-opacity-20
        ${pipeline.disabled ? 'opacity-50' : ''}`}
      onClick={() =>
        props.pushModal(
          <ModalWrapper keepOpenOnClick wClass="max-w-4xl w-full">
            {lscl ? (
              <WritePipeline {...props} settings={{ ...pipeline, id: props.id }} edit />
            ) : (
              <BuildPipeline {...props} settings={{ ...pipeline, id: props.id }} edit />
            )}
          </ModalWrapper>
        )
      }
    >
      <div
        className={`p-2 rounded-l-lg font-bold text-right bg-opacity-50
          ${pipeline.disabled ? 'bg-neutral' : 'bg-success'}`}
      >
        {props.id}
      </div>
      <div className="col-span-2 flex flex-row items-center justify-start">
        {lscl ? (
          <b>
            <em>LSCL</em>
          </b>
        ) : (
          <>
            <b>
              <em>{pipeline.input.id}</em>
            </b>
            <div className="flex flex-row items-center justify-center">
              <RightIcon
                className={`h-4 w-4 ${pipeline.disabled ? 'text-error' : 'text-success'}`}
                stroke={2}
              />
              <RightIcon
                className={`h-4 w-4 -ml-3 ${pipeline.disabled ? 'text-error' : 'text-success'}`}
                stroke={2}
              />
              <RightIcon
                className={`h-4 w-4 -ml-3 ${pipeline.disabled ? 'text-error' : 'text-success'}`}
                stroke={2}
              />
            </div>
            <b>{pipeline.output.id}</b>
          </>
        )}
      </div>
    </button>
  )
}

export const ConnectorPipelines = (props) => {
  const { pushModal, popModal } = useContext(ModalContext)

  return (
    <>
      <h3>{props.viewConfig.title ? props.viewConfig.title : props.viewConfig.label}</h3>
      {Object.keys(props.data?.connector?.pipelines || {}).map((id) => {
        return <ShowPipeline key={id} {...props} id={id} {...{ pushModal, popModal }} />
      })}
      <div className="flex flex-row flex-wrap items-center gap-4 mt-4 justify-end">
        <button
          className="btn btn-primary"
          onClick={() =>
            pushModal(
              <ModalWrapper keepOpenOnClick wClass="max-w-4xl w-full">
                <BuildPipeline {...props} pushModal={pushModal} popModal={popModal} edit={false} />
              </ModalWrapper>
            )
          }
        >
          <PuzzleIcon className="w-6 h-6 mr-4" /> Build Pipeline
        </button>
        <button
          className="btn btn-primary"
          onClick={() =>
            pushModal(
              <ModalWrapper keepOpenOnClick wClass="max-w-4xl w-full">
                <WritePipeline {...props} pushModal={pushModal} popModal={popModal} edit={false} />
              </ModalWrapper>
            )
          }
        >
          <DocumentIcon className="w-6 h-6 mr-4" /> Write LSCL
        </button>
      </div>
    </>
  )
}
