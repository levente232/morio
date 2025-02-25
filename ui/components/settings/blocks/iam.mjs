import Joi from 'joi'
import { useContext } from 'react'
import { Markdown } from 'components/markdown.mjs'
import {
  FingerprintIcon,
  KeyIcon,
  MorioIcon,
  StorageIcon,
  UnavailableIcon,
  UserIcon,
  PlayIcon,
} from 'components/icons.mjs'
import { ModalContext } from 'context/modal.mjs'
import { Popout } from 'components/popout.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { FormWrapper, loadFormDefaults } from './form.mjs'

const iconProps = { fill: 0, stroke: 1.5, className: 'w-8 h-8' }

const brands = {
  mrt: <MorioIcon {...iconProps} />,
  ldap: <StorageIcon {...iconProps} />,
  local: <UserIcon {...iconProps} />,
  apikey: <KeyIcon {...iconProps} />,
}

const ProviderHeader = ({ id, title }) => (
  <h3 className="flex flex-row justify-between items-center w-full">
    {brands[id] ? brands[id] : <FingerprintIcon {...iconProps} />}
    <span>
      <b>{title}</b>
    </span>
    <FingerprintIcon className="w-12 h-12" stroke={1.25} />
  </h3>
)

const AddProvider = (props) => {
  const defaults = loadFormDefaults({ provider: props.id }, props.form)

  return (
    <div className="max-w-2xl w-full">
      <ProviderHeader id={props.id} title={props.title} />
      <ProviderDisabled provider={props.id} flags={props.data.tokens?.flags} />
      {props.form ? (
        <FormWrapper
          {...props}
          defaults={defaults}
          action="create"
          local={props.blocks[props.id].local}
        />
      ) : (
        <p>No form for this type of identity provider</p>
      )}
    </div>
  )
}

const ProviderDisabled = ({ provider, flags = {} }) =>
  flags[`DISABLE_IDP_${provider.toUpperCase()}`] ? (
    <Popout important noP>
      <h5>This provider type is disabled</h5>
      <p>
        The <code>DISABLE_IDP_{provider.toUpperCase()}</code> feature flag is currently active.
        <br />
        This disables the <code>{provider}</code> identity provider.
      </p>
    </Popout>
  ) : null

const UpdateProvider = (props) => {
  const { provider } = props
  const defaults = loadFormDefaults(
    props.data.iam.providers[props.id],
    props.blocks?.[provider]?.form
  )

  const removeLocal = () => {
    props.update(`iam.providers.${props.id}`, 'MORIO_UNSET')
    props.popModal()
  }

  return (
    <div className="max-w-2xl w-full">
      <ProviderHeader id={props.id} title={props.title} />
      <ProviderDisabled provider={provider} flags={props.data.tokens?.flags} />
      {props.blocks?.[provider]?.form ? (
        <FormWrapper
          {...props}
          form={props.blocks[provider].form}
          defaults={defaults}
          action="update"
          local={props.blocks[provider].local}
          freeze={['id']}
          {...{ removeLocal }}
        />
      ) : (
        <p>No form for this type of identity provider</p>
      )}
    </div>
  )
}

const ProviderButton = ({ title, about, id, type, onClick, flags = {} }) => (
  <div className="indicator w-full">
    <button
      className={`rounded-lg p-0 px-2 shadow hover:bg-secondary hover:bg-opacity-20 hover:cursor-pointer w-full
        flex flex-row gap-0 items-center`}
      onClick={onClick}
    >
      <div className="flex flex-col items-start justify-between p-2 grow text-left">
        <span className="capitalize text-lg font-bold">{title ? title : id}</span>
        <span className="-mt-1 text-sm italic opacity-80">{about}</span>
      </div>
      <div>
        {flags[`DISABLE_IDP_${type.toUpperCase()}`] ? (
          <UnavailableIcon className="w-8 h-8 text-error" stroke={2.5} />
        ) : brands[type] ? (
          brands[type]
        ) : (
          <FingerprintIcon {...iconProps} />
        )}
      </div>
    </button>
  </div>
)

export const AuthProviders = (props) => {
  const { blocks, data } = props
  const { pushModal, popModal } = useContext(ModalContext)

  return (
    <>
      <h3>{props.viewConfig.title ? props.viewConfig.title : props.viewConfig.label}</h3>
      <Markdown>{props.viewConfig.about}</Markdown>
      {data.iam?.providers ? (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <ProviderButton
            available
            flags={data.tokens?.flags}
            id="mrt"
            type="mrt"
            title="Morio Root Token"
            about="Authentication via the Morio Root Token"
            onClick={() =>
              pushModal(
                <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
                  <UpdateProvider
                    {...props}
                    id="mrt"
                    provider="mrt"
                    {...{ pushModal, popModal }}
                    {...blocks.mrt}
                  />
                </ModalWrapper>
              )
            }
          />
          {Object.keys(data.iam?.providers || {})
            .filter((id) => id !== 'mrt')
            .map((id) => (
              <ProviderButton
                available
                key={id}
                flags={data.tokens?.flags}
                id={id}
                title={data.iam.providers[id].label}
                type={data.iam.providers[id].provider}
                about={props.viewConfig?.blocks?.[data.iam.providers[id].provider]?.about}
                {...data.iam.providers[id]}
                onClick={() =>
                  pushModal(
                    <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
                      <UpdateProvider
                        {...props}
                        {...{ id, pushModal, popModal }}
                        {...data.iam.providers[id]}
                        title={data.iam.providers[id].label}
                      />
                    </ModalWrapper>
                  )
                }
              />
            ))}
        </div>
      ) : null}
      <h4 className="mt-4 capitalize">Add an identity provider</h4>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {Object.keys(blocks)
          .filter((id) =>
            data?.iam?.providers ? !Object.keys(data.iam.providers).includes(id) : true
          )
          .filter((id) => id !== 'mrt')
          .map((id) => (
            <ProviderButton
              key={id}
              id={id}
              type={id}
              flags={data.tokens?.flags}
              {...blocks[id]}
              onClick={() =>
                pushModal(
                  <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
                    <AddProvider {...props} {...{ id, pushModal, popModal }} {...blocks[id]} />
                  </ModalWrapper>
                )
              }
            />
          ))}
      </div>
    </>
  )
}

export const LoginUi = ({ data, update }) => {
  return (
    <>
      <h3>Provider Order & Visibility</h3>
      <ProviderOrder {...{ data, update }} />
    </>
  )
}

const ProviderOrder = ({ data, update }) => {
  const { pushModal } = useContext(ModalContext)
  /*
   * We need to handle things like providers being removed and so on
   */
  const order = new Set()

  //  data.iam?.ui?.order || orderBy(Object.keys(data.iam?.providers) || {}, 'label', 'asc')

  for (const id of data.iam?.ui?.order || []) {
    if (data.iam.providers[id]) order.add(id)
  }
  for (const id in data.iam?.providers) {
    if (!order.has(id)) order.add(id)
  }

  if (order.size === 0)
    return (
      <Popout note>
        <h4>You cannot order what you do not (yet) have</h4>
        <p>
          Once you have configured identity providers, you will be able to configure here how they
          are to be presented on the sign in page.
        </p>
      </Popout>
    )

  const moveUp = (i) => {
    const newOrder = [...order]
    if (i === 0) return
    const hold = newOrder[i - 1]
    newOrder[i - 1] = newOrder[i]
    newOrder[i] = hold
    update('iam.ui.order', newOrder)
  }

  return (
    <div className="flex flex-col gap-1">
      {[...order].map((id, i) => {
        const type = (data.iam.providers[id].provider || id).toUpperCase()
        const flag = `DISABLE_IDP_${type}`

        return (
          <div key={id} className="flex flex-row gap-2 items-center p-2 px-4">
            <span className="w-8 text-center block font-bold opacity-70">{i + 1}</span>
            <button className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => moveUp(i)}>
              <PlayIcon className="w-5 h-5 -rotate-90" fill />
            </button>
            <div className="font-bold grow p-1 px-4 flex flex-row gap-1 items-center">
              {data.tokens.flags?.[flag] ? (
                <button
                  onClick={() =>
                    pushModal(
                      <ModalWrapper keepOpenOnClick wClass="max-w-2xl w-full">
                        <h4>This identity provider is disabled by a feature flag</h4>
                        <p>
                          The <code>{flag}</code> feature flag is active which disables all identity
                          providers of type
                          <code>{type.toLowerCase()}, including this one.</code>.
                        </p>
                      </ModalWrapper>
                    )
                  }
                >
                  <UnavailableIcon className="w-5 h-5 text-error" stroke={3} />
                </button>
              ) : null}
              {data.iam?.providers?.[id]?.label || id}
            </div>
            <div className="w-3/5">
              <FormWrapper form={providerVisibilityForm(id, data)} update={update} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

const providerVisibilityForm = (id, data) => [
  {
    key: `iam.ui.visibility.${id}`,
    schema: Joi.string().valid('tab', 'icon', 'disabled').required().label('Visibilty'),
    inputType: 'buttonList',
    title: 'Visibility',
    label: data.iam.providers?.[id]?.label || id,
    current: data.iam.ui?.visibility?.[id] || 'tab',
    dflt: 'tab',
    dir: 'row',
    dense: true,
    list: [
      {
        val: 'tab',
        label: 'Show as tab',
      },
      {
        val: 'icon',
        label: 'Hide behind icon',
      },
      {
        val: 'disabled',
        label: 'Hide completely',
      },
    ],
  },
]
