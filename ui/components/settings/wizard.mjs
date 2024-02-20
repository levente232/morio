// Dependencies
import get from 'lodash.get'
import { atomWithLocation } from 'jotai-location'
import { validate, validateSettings, cloneAsPojo } from 'lib/utils.mjs'
import yaml from 'yaml'
// Templates
import { templates } from './templates/index.mjs'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useContext, useEffect, useCallback } from 'react'
import { useStateObject } from 'hooks/use-state-object.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { useAtom } from 'jotai'
// Components
import { Breadcrumbs } from 'components/layout/breadcrumbs.mjs'
import { Block } from './blocks/index.mjs'
import { Highlight } from 'components/highlight.mjs'
import { SettingsReport, DeploymentReport } from './report.mjs'
import { RightIcon, SettingsIcon, QuestionIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { DiffViewer, diffCheck } from 'components/settings/diff.mjs'
import { SettingsNavigation } from './navigation.mjs'
import { viewAsSectionPath, sectionPathAsView } from './utils.mjs'
import { LogoSpinner } from 'components/animations.mjs'

const Welcome = ({ setView }) => (
  <>
    <p>These pages allow you to update the settings of this Morio deployment.</p>
    <Popout warning compact noP dense>
      All changes are ephemeral until you apply them.
    </Popout>
    <Popout tip>
      <h5>Getting started</h5>
      <p>
        Use the navigation menu on the right to locate the settings you want to update.
        <br />
        When you have made your changes{' '}
        <a role="button" onClick={() => setView('validate')}>
          navigate to the validation page
        </a>{' '}
        to apply your changes:
      </p>
      <ul className="list list-disc list-inside ml-4">
        <li>
          <b>Step 1</b>: Click the <b>Validate Settings</b> button
          <br />
          <small className="pl-4">No changes will be made at this point</small>
        </li>
        <li>
          <b>Step 2</b>: Click the <b>Apply Settings</b> button to make the changes permanent
          <br />
          <small className="pl-4">Only possible if validation is successful</small>
        </li>
      </ul>
      <h5>Shortcuts</h5>
      <ul className="list list-disc list-inside ml-4">
        <li>
          The <b>Validate Settings</b> button on the right will always take you to{' '}
          <a role="button" onClick={() => setView('validate')}>
            the validation page
          </a>
        </li>
        <li>
          The <b>Getting Started</b> button on the right will always bring you back to{' '}
          <a role="button" onClick={() => setView('start')}>
            this page
          </a>
        </li>
      </ul>
    </Popout>
  </>
)

const Nr = ({ children, disabled = false, color = 'primary' }) => (
  <span
    className={`font-black w-8 h-8 border rounded-full border-2
    flex flex-col items-center justify-center ${
      disabled
        ? 'text-base-content border-base-content opacity-20'
        : color === 'accent'
          ? `border-accent-content text-accent-content`
          : `border-primary-content text-primary-content`
    }`}
  >
    {children}
  </span>
)

/**
 * Displays settings validation
 */
const ShowSettingsValidation = ({
  api,
  mSettings,
  deploy,
  validationReport,
  setValidationReport,
  setLoadingStatus,
}) => (
  <>
    {validationReport ? (
      <>
        <SettingsReport report={validationReport} />
        {validationReport.valid ? (
          <div className="text-center">
            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn btn-primary btn-lg flex flex-row justify-between"
                onClick={async () =>
                  setValidationReport(await validateSettings(api, mSettings, setLoadingStatus))
                }
              >
                <Nr>1</Nr>
                Validate Settings
              </button>
              <button
                className="btn btn-accent btn-lg flex flex-row justify-between"
                onClick={deploy}
              >
                <Nr color="accent">2</Nr>
                Apply Settings
              </button>
            </div>
            <Popout warning compact noP>
              Deploying these settings may cause services to restart
            </Popout>
          </div>
        ) : null}
      </>
    ) : (
      <>
        <p>
          Click the <b>Validate Settings</b> button below to submit the updated settings for
          validation.
          <br />
          After validation succeeds, you will be able to apply the settings.
        </p>
        <div className="text-center">
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn btn-primary btn-lg flex flex-row justify-between"
              onClick={async () =>
                setValidationReport(await validateSettings(api, mSettings, setLoadingStatus))
              }
            >
              <Nr>1</Nr>
              Validate Settings
            </button>
            <button className="btn btn-primary btn-lg flex flex-row justify-between" disabled>
              <Nr disabled>2</Nr>
              Apply Settings
            </button>
          </div>
          <Popout note compact noP>
            No changes will be made to your Morio setup at this time
          </Popout>
        </div>
      </>
    )}
  </>
)

/**
 * Displays settings preview (or a button to show it)
 */
const ShowSettingsPreview = ({ preview, setPreview, mSettings }) =>
  preview ? (
    <div className="w-full mt-8">
      <h3>Settings Preview</h3>
      <Highlight language="yaml">{yaml.stringify(mSettings)}</Highlight>
    </div>
  ) : null

/**
 * Keeps track of the view in the URL location
 */
export const viewInLocation = atomWithLocation('deployment/node_count')

/*
 * Start wizard with this view
 */
const startView = 'start'

const NotCool = () => (
  <div className="flex flex-row gap-8 justify-start">
    <div className="w-full max-w-4xl p-8 grow">
      <div className="w-full">
        <h1 className="capitalize flex w-full max-w-4xl justify-between">
          Things are Not Cool
          <SettingsIcon className="w-16 h-16" />
        </h1>
        <p>We were unable to fetch the running settings from the API.</p>
      </div>
    </div>
  </div>
)

const PleaseWait = () => (
  <div className="flex flex-row gap-8 justify-start">
    <div className="w-full max-w-4xl p-8 grow">
      <div className="w-full">
        <h1 className="capitalize flex w-full max-w-4xl justify-between">
          One moment please
          <SettingsIcon className="w-16 h-16" />
        </h1>
        <div className="w-36 mx-auto">
          <LogoSpinner />
        </div>
      </div>
    </div>
  </div>
)

const getRunningSettings = async (api, setOk, setKo) => {
  const result = await api.getCurrentSettings()
  if (result[1] === 200 && result[0].deployment) {
    const newMSettings = { ...result[0] }
    setOk(JSON.parse(JSON.stringify(newMSettings)))
  } else setKo(true)
}

/**
 * This is the React component for the settings wizard itself
 */
export const SettingsWizard = (props) => {
  const [runningSettings, setRunningSettings] = useState(false) // Holds the current running settings
  const [notCool, setNotCool] = useState(false)
  const { api } = useApi()

  /*
   * Effect for loading the running settings
   */
  useEffect(() => {
    getRunningSettings(api, setRunningSettings, setNotCool)
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  return runningSettings?.metadata ? (
    <PrimedSettingsWizard {...props} {...{ runningSettings }} />
  ) : notCool ? (
    <NotCool />
  ) : (
    <PleaseWait />
  )
}

/**
 * This is the React component for the settings wizard itself
 */
export const PrimedSettingsWizard = (props) => {
  /*
   * Destructure props
   */
  const { prefix = '/settings', runningSettings } = props

  /*
   * React state
   */
  const [mSettings, update, setMSettings] = useStateObject(runningSettings) // Holds the settings this wizard builds
  const [valid, setValid] = useState(false) // Whether or not the current input is valid
  const [validationReport, setValidationReport] = useState(false) // Holds the validatino report
  const [view, _setView] = useAtom(viewInLocation) // Holds the current view
  const [preview, setPreview] = useState(false) // Whether or not to show the settings preview
  const [deployResult, setDeployResult] = useState(false)
  const [showDelta, setShowDelta] = useState(false)

  /*
   * Figure out the current sectionPath from the view
   */
  const sectionPath = viewAsSectionPath(view.pathname, prefix)

  /*
   * Handler method for view state updates
   */
  const setView = useCallback(
    (sectionPath) => {
      console.log('setting view to', sectionPath)
      _setView((prev) => ({
        ...prev,
        pathname: sectionPathAsView(sectionPath, prefix),
      }))
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [prefix]
  )

  /*
   * Method to revert to running settings
   */
  const revert = () => setMSettings(cloneAsPojo(runningSettings))

  /*
   * API client
   */
  const { api } = useApi()

  /*
   * Loading context
   */
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  /*
   * Helper method to load a block into the wizard
   * Sets the view, update valid, and invalidate the report
   */
  const loadView = (key) => {
    setView(key)
    if (key !== 'validate') setValid(validate(key, get(mSettings, key), mSettings))
    setValidationReport(false)
  }

  /*
   * Helper method to deploy the settings
   */
  const deploy = async () => {
    setLoadingStatus([true, 'Uploading settings'])
    const [data, status] = await api.deploy(mSettings)
    if (data.result !== 'success' || status !== 200)
      return setLoadingStatus([true, `Unable to deploy the settings`, true, false])
    else {
      setDeployResult(data)
      setLoadingStatus([true, 'Deployment initialized', true, true])
    }
  }

  if (!mSettings.deployment) return null

  if (deployResult)
    return (
      <div className="w-fill min-h-screen max-w-2xl mx-auto">
        <DeploymentReport result={deployResult} />
      </div>
    )

  /*
   * Load the template and section
   */
  const [group, section] = sectionPath.split('.')
  const template = templates[group] ? templates[group]({ mSettings, update }) : false
  const doValidate = group === 'validate'

  /*
   * Handle settings delta
   */
  const delta =
    diffCheck(yaml.stringify(runningSettings), yaml.stringify(mSettings)).length > 1 ? true : false

  const showProps = doValidate
    ? {
        api,
        mSettings,
        deploy,
        validationReport,
        setValidationReport,
        setLoadingStatus,
      }
    : {
        update,
        data: mSettings,
        setValid,
        sectionPath,
        template,
        group,
        section,
        valid,
        loadView,
        setView,
      }

  return (
    <div className="flex flex-row gap-8 justify-start">
      <div className="w-full max-w-4xl p-8 grow">
        <Breadcrumbs page={['settings', ...sectionPath.split('.')]} />
        <div className="w-full">
          <h1 className="capitalize flex w-full max-w-4xl justify-between">
            {template.children?.[section]?.title
              ? template.children[section]?.title
              : template.title
                ? template.title
                : doValidate
                  ? 'Validate Settings'
                  : 'Update Settings'}
            <SettingsIcon className="w-16 h-16" />
          </h1>
          {template === false && !doValidate ? (
            <Welcome setView={setView} />
          ) : doValidate ? (
            <ShowSettingsValidation {...showProps} />
          ) : (
            <Block {...showProps} edit={true} />
          )}
          {!doValidate && delta ? (
            <Popout note>
              <h4>You have made changes that are yet to be deployed</h4>
              <p>
                The settings have been edited, and are now different from the deployed settings.
              </p>
              {showDelta ? (
                <div className="my-4">
                  <DiffViewer
                    from={yaml.stringify(runningSettings)}
                    to={yaml.stringify(mSettings)}
                    fromTitle="Currently deployed settings"
                    toTitle="Your edits"
                  />
                </div>
              ) : null}
              <div className="flex flex-row flex-wrap gap-2 justify-end w-full">
                <button className="btn btn-warning btn-ghost" onClick={revert}>
                  Revert to Running Settings
                </button>
                <button
                  className="btn btn-primary btn-outline"
                  onClick={() => setShowDelta(!showDelta)}
                >
                  {showDelta ? 'Hide' : 'Show'} Settings Delta
                </button>
              </div>
            </Popout>
          ) : null}
          <ShowSettingsPreview {...{ preview, setPreview, mSettings }} />
        </div>
      </div>
      <div className="grow-0 shrink-0 pt-24 min-h-screen w-64 pr-4">
        <h5>Settings</h5>
        <SettingsNavigation
          view={sectionPath}
          loadView={loadView}
          nav={templates}
          mSettings={mSettings}
          edit
        />
        <h5>Actions</h5>
        <div className="flex flex-col gap-2">
          <button
            className="btn btn-outline btn-primary btn-sm w-full"
            onClick={() => loadView('start')}
            disabled={sectionPath === 'start'}
          >
            Getting Started
          </button>
          <button
            className="btn btn-outline btn-primary btn-sm w-full"
            onClick={() => setPreview(!preview)}
          >
            {preview ? 'Hide ' : 'Show '} settings preview
          </button>
          <button className="btn btn-primary w-full" onClick={() => loadView('validate')}>
            <span>Validate Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}
