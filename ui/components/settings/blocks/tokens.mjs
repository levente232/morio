import { useState, useEffect, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import {
  PlusIcon,
  TrashIcon,
  VariableIcon,
  WarningIcon,
  QuestionIcon,
  BoolNoIcon,
  BoolYesIcon,
} from 'components/icons.mjs'
import { ModalContext } from 'context/modal.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import Joi from 'joi'
import { FormWrapper } from './form.mjs'
import { slugify } from 'lib/utils.mjs'
import { FormControl } from '../../inputs.mjs'
import SecretSelectDocs from 'mdx/secret-select.mdx'
import VariableSelectDocs from 'mdx/variable-select.mdx'
import { fdocs } from 'config/flags.mjs'
import Markdown from 'react-markdown'

const TokenHelp = ({ secrets, pushModal }) => (
  <button
    className=""
    onClick={() =>
      pushModal(
        <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
          {secrets ? <SecretSelectDocs /> : <VariableSelectDocs />}
        </ModalWrapper>
      )
    }
  >
    <QuestionIcon className="w-4 h-4 text-warning" />
  </button>
)

export const TokenSelect = (props) => {
  const { pushModal } = useContext(ModalContext)

  const {
    update,
    secrets = true,
    mSettings,
    label = '',
    labelTR = '',
    labelBL = '',
    labelBR = '',
    id,
    current = false,
  } = props

  if (!id) return null
  const allTokens = secrets ? mSettings?.tokens?.secrets || {} : mSettings?.tokens?.vars || {}

  return (
    <FormControl
      {...{ label, labelTR, labelBL, labelBR }}
      forId={id}
      labelTR={<TokenHelp {...{ pushModal, secrets }} />}
      value={current}
    >
      <select
        className={`select w-full select-bordered select-success`}
        onChange={(evt) => update(evt.target.value)}
      >
        <option disabled={current ? false : true} selected>
          Pick a {secrets ? 'secret' : 'variable'}
        </option>
        {Object.keys(allTokens).map((key) => {
          const val = `{{{ ${key} }}}`
          return (
            <option key={key} value={val}>
              {key}
            </option>
          )
        })}
        <option disabled>
          You can add {secrets ? 'secrets' : 'variables'} via tokens &raquo;{' '}
          {secrets ? 'secrets' : 'variables'}
        </option>
      </select>
    </FormControl>
  )
}

export const TokenInput = ({ token, setToken }) => {
  const [key, setKey] = useState(token?.key || '')
  const [val, setVal] = useState(token?.val === undefined ? '' : token.val)
  const [type, setType] = useState(token?.type || 'string')

  const valAs = (v, type) => {
    if (type === 'bool') return !v || `${v}`.toLowerCase() === 'false' ? false : true
    else if (type === 'number') {
      if (isNaN(Number(v))) return 0
      else return Number(v)
    } else if (type === 'string') return `${v}`
  }

  const localUpdate = (k, v) => {
    const newToken = { ...token }
    if (k === 'type') {
      setType(v)
      const newVal = valAs(val, v)
      setVal(newVal)
      newToken.type = v
      newToken.val = newVal
    } else if (k === 'key') {
      const newKey = slugify(v).toUpperCase().split('-').join('_')
      setKey(newKey)
      newToken.key = newKey
    } else if (k === 'val') {
      const newVal = valAs(v, type)
      setVal(newVal)
      newToken.val = newVal
    }

    setToken(newToken)
  }

  return (
    <FormWrapper
      update={localUpdate}
      form={[
        [
          {
            schema: Joi.string().required().label('Key'),
            current: key,
            placeholder: 'NAME',
            label: 'Name',
            labelBL: `The name of the token`,
            key: 'key',
            valid: () => true,
          },
          {
            label: 'Type',
            labelBL: 'How to store this value',
            labelTR: (
              <div className="flex flex-row gap-2 text-warning">
                <WarningIcon className="w-4 h-4" />
                <span className="italic opacity-70">Value will be cast to this type</span>
              </div>
            ),
            schema: Joi.string().required().valid('string', 'number', 'bool').label('Type'),
            key: 'type',
            current: type,
            inputType: 'buttonList',
            dir: 'row',
            dense: true,
            list: [
              { val: 'string', label: 'String' },
              { val: 'number', label: 'Number' },
              { val: 'bool', label: 'Boolean' },
            ],
          },
        ],
        {
          schema:
            type === 'number'
              ? Joi.number().required().label('Value')
              : Joi.string().required().label('Value'),
          current: val,
          inputType: type === 'bool' ? 'toggle' : type === 'string' ? 'textarea' : 'text',
          placeholder: 'Value goes here',
          label: 'Value',
          abelBL: 'The value of the token',
          key: 'val',
          valid: () => true,
        },
      ]}
    />
  )
}

const AddVariable = ({ update, data, current = {}, edit, secrets, popModal }) => {
  const [token, setToken] = useState(current)

  const create = () => {
    update(`tokens.${secrets ? 'secrets' : 'vars'}.${token.key}`, token.val, data)
    popModal()
  }
  const remove = () => {
    update(`tokens.${secrets ? 'secrets' : 'vars'}.${token.key}`, 'MORIO_UNSET', data)
    popModal()
  }

  return (
    <div className="max-w-2xl w-full">
      <h3 className="flex flex-row justify-between items-center w-full">
        {edit ? 'Update' : 'Create'} {secrets ? 'Secret' : 'Variable'}
        <VariableIcon className="w-12 h-12" stroke={2} />
      </h3>
      <TokenInput {...{ token, setToken }} />
      <div className="mt-2 flex flex-row gap-2 items-center justify-center">
        <button
          className="btn btn-primary px-12"
          onClick={create}
          disabled={!token || !token.key || token.key.length < 2}
        >
          {edit ? 'Update' : 'Create'} {secrets ? 'Secret' : 'Variable'}
        </button>
        {edit ? (
          <button className="btn btn-error" onClick={remove}>
            <TrashIcon />
          </button>
        ) : null}
      </div>
    </div>
  )
}

const ShowVariable = ({ pushModal, popModal, token, update, data, secrets }) => (
  <button
    className="btn btn-outline btn-primary btn-sm"
    onClick={() =>
      pushModal(
        <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
          <AddVariable
            {...{ pushModal, popModal, update, data, secrets }}
            edit={true}
            current={token}
          />
        </ModalWrapper>
      )
    }
  >
    {token.key}
  </button>
)

export const Tokens = ({ update, data, secrets = false }) => {
  const { pushModal, popModal } = useContext(ModalContext)

  const allTokens = secrets ? data?.tokens?.secrets || {} : data?.tokens?.vars || {}

  return (
    <>
      <div className="flex flex-row gap-2 flex-wrap mb-4">
        {Object.keys(allTokens)
          .sort()
          .map((key) => {
            return (
              <ShowVariable
                key={key}
                {...{ pushModal, popModal, data, secrets, update }}
                token={{ key, val: allTokens[key] }}
              />
            )
          })}
      </div>
      <button
        className="btn btn-primary"
        onClick={() =>
          pushModal(
            <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
              <AddVariable {...{ popModal, pushModal, data, update, secrets }} edit={false} />
            </ModalWrapper>
          )
        }
      >
        <PlusIcon className="w-6 h-6 mr-4" stroke={3} /> Add {secrets ? 'Secret' : 'Variable'}
      </button>
    </>
  )
}

export const Vars = Tokens
export const Secrets = (props) => <Tokens {...props} secrets />

export const Flags = ({ update, data }) => {
  const [flags, setFlags] = useState({})
  const { api } = useApi()

  useEffect(() => {
    const loadFlags = async () => {
      const [body, status] = await api.getDynamicFlagsConfig()
      if (status === 200 && body) setFlags(body)
    }
    loadFlags()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [data])

  const mergedFlags = {
    ...flags,
    ...(data.tokens?.flags || {}),
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center gap-2 flex-wrap mb-4">
          <ul className="list list-inside ml-4 list-disc">
            {Object.keys(mergedFlags || {})
              .sort()
              .map((key) => (
                <li key={key} className="flex flex-row items-center gap-2 flex-wrap py-0.5">
                  {data.tokens?.flags?.[key] ? <BoolYesIcon /> : <BoolNoIcon />}
                  <a href={`#${key.toLowerCase()}`} className="textsm">
                    {key}
                  </a>
                </li>
              ))}
          </ul>
        </div>
        {Object.keys(mergedFlags || {})
          .sort()
          .map((key) => (
            <label
              id={key.toLowerCase()}
              className={`scroll-mt-20 hover:cursor-pointer border-4 border-y-0 border-r-0 p-2 px-4 shadow
              hover:bg-base-100 hover:bg-opacity-10 rounded bg-opacity-10
              ${data?.tokens?.flags?.[key] ? 'border-success bg-success' : 'border-error bg-error'}
              `}
              key={key}
              htmlFor={key}
            >
              <div htmlFor={key} className="flex flex-row gap-4 items-center">
                <h5 className={data?.tokens?.flags?.[key] ? '' : ''}>{key}</h5>
                <span className="grow"></span>
                <input
                  id={key}
                  type="checkbox"
                  value={data.tokens?.flags?.[key]}
                  onChange={() => update(`tokens.flags.${key}`, !data.tokens?.flags?.[key])}
                  className="toggle my-3 toggle-success"
                  checked={data.tokens?.flags?.[key]}
                />
                <label className="hover:cursor-pointer" htmlFor={key}>
                  {flags[key]}
                </label>
                {data.tokens?.flags?.[key] ? <BoolYesIcon /> : <BoolNoIcon />}
              </div>
              <Markdown>{fdocs[key]}</Markdown>
            </label>
          ))}
      </div>
    </>
  )
}
