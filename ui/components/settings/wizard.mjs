// Dependencies
import { atomWithLocation } from 'jotai-location'
import { validateSettings, cloneAsPojo } from 'lib/utils.mjs'
import yaml from 'yaml'
// Templates
import { templates } from './templates/index.mjs'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
import { ModalContext } from 'context/modal.mjs'
// Hooks
import { useState, useContext, useEffect, useCallback } from 'react'
import { useStateObject } from 'hooks/use-state-object.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { useAtom } from 'jotai'
// Components
import { Breadcrumbs } from 'components/layout/breadcrumbs.mjs'
import { Block } from './blocks/index.mjs'
import { Highlight } from 'components/highlight.mjs'
import { SettingsReport } from './report.mjs'
import {
  ResetIcon,
  SearchIcon,
  CompareIcon,
  SettingsIcon,
  OkIcon,
  CheckCircleIcon,
} from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { DiffViewer, diffCheck } from 'components/settings/diff.mjs'
import { SettingsNavigation } from './navigation.mjs'
import { viewAsSectionPath, sectionPathAsView } from './utils.mjs'
import { Spinner } from 'components/animations.mjs'
import { Box } from 'components/box.mjs'

const Welcome = ({ setView }) => (
  <>
    <p>These pages allow you to update the settings of this Morio deployment.</p>
    <h2>Getting started</h2>
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
    <Popout note compact noP dense>
      All changes are ephemeral until you apply them.
    </Popout>
    <h5>Shortcuts</h5>
    <ul className="list list-disc list-inside ml-4">
      <li>
        The <b>Validate Settings</b> button at the top will always take you to{' '}
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
export const ShowSettingsValidation = ({
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
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
                disabled={!validationReport.deployable}
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
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
export const ShowSettingsPreview = ({ preview, mSettings }) =>
  preview ? (
    <div className="w-full mt-8 max-w-4xl">
      <h3>Settings Preview</h3>
      <Highlight language="yaml">{yaml.stringify(mSettings)}</Highlight>
    </div>
  ) : null

/**
 * Keeps track of the view in the URL location
 */
export const viewInLocation = atomWithLocation('cluster/nodes')

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
          <Spinner />
        </div>
      </div>
    </div>
  </div>
)

export const getRunningSettings = async (api, setOk, setKo) => {
  const result = await api.getCurrentSettings()
  if (result[1] === 200 && result[0].cluster) {
    const newMSettings = { ...result[0] }
    setOk(JSON.parse(JSON.stringify(newMSettings)))
  } else setKo(true)
}

export const getDynamicConfig = async (api, setOk) => {
  // Tap config
  const dconf = {}
  const result = await api.getDynamicTapConfig()
  if (result[1] === 200 && result[0]) {
    dconf.tap = result[0]
  }
  setOk(JSON.parse(JSON.stringify(dconf)))
}

/**
 * This is the React component for the settings wizard itself
 */
export const SettingsWizard = (props) => {
  const [runningSettings, setRunningSettings] = useState(false) // Holds the current running settings
  const [dconf, setDconf] = useState(false) // Holds the dynamic configuration
  const [notCool, setNotCool] = useState(false)
  const { clearModal, pushModal } = useContext(ModalContext)
  const { api } = useApi()

  /*
   * Effect for loading the running settings
   * This also loads the dynamic tap settings
   */
  useEffect(() => {
    getRunningSettings(api, setRunningSettings, setNotCool)
    getDynamicConfig(api, setDconf)
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  return runningSettings?.cluster ? (
    <PrimedSettingsWizard {...props} {...{ runningSettings, dconf, clearModal, pushModal }} />
  ) : notCool ? (
    <NotCool />
  ) : (
    <PleaseWait />
  )
}

const WizardWrapper = ({
  title,
  Icon = SettingsIcon,
  sectionPath,
  loadView,
  mSettings,
  children,
  dconf,
}) => (
  <div className="flex flex-row justify-between gap-8 max-w-full">
    <div className="p-8 grow shrink min-w-0 flex-auto">
      <Breadcrumbs page={['settings', ...sectionPath.split('.')]} />
      <div className="w-full">
        <h1 className="capitalize flex w-full justify-between">
          {title}
          <Icon className="w-16 h-16" />
        </h1>
        {children}
      </div>
    </div>
    <div className="grow-0 shrink-0 pt-20 min-h-screen lg:w-64 2xl:w-96">
      <SettingsNavigation
        view={sectionPath}
        loadView={loadView}
        nav={templates}
        mSettings={mSettings}
        dconf={dconf}
        edit
      />
    </div>
  </div>
)

/**
 * This is the React component for the settings wizard itself
 */
export const PrimedSettingsWizard = (props) => {
  /*
   * Destructure props
   */
  const { prefix = '/settings', runningSettings, dconf, clearModal, pushModal } = props

  /*
   * React state
   */
  const [mSettings, update, setMSettings] = useStateObject(runningSettings) // Holds the settings this wizard builds
  const [validationReport, setValidationReport] = useState(false) // Holds the validatino report
  const [view, _setView] = useAtom(viewInLocation) // Holds the current view
  const [preview, setPreview] = useState(false) // Whether or not to show the settings preview
  const [showDelta, setShowDelta] = useState(false)
  const [deployOngoing, setDeployOngoing] = useState(false)

  /*
   * Figure out the current sectionPath from the view
   */
  const sectionPath = viewAsSectionPath(view.pathname, prefix)

  /*
   * Handler method for view state updates
   */
  const setView = useCallback(
    (sectionPath) => {
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
    setDeployOngoing(false)
    setView(key)
    setValidationReport(false)
  }

  /*
   * Helper method to deploy the settings
   */
  const deploy = async () => {
    setLoadingStatus([true, 'Uploading settings'])
    setDeployOngoing(true)
    const result = await api.deploy(mSettings)
    return result[1] === 204
      ? setLoadingStatus([true, 'Settings updated', true, true])
      : setLoadingStatus([true, `Unable to deploy the settings`, true, false])
  }

  if (!mSettings.cluster) return null

  /*
   * Load the template and section
   */
  const [group, section] = sectionPath.split('.')
  const template = templates[group]
    ? templates[group]({ mSettings, update, dconf, clearModal, pushModal })
    : false
  const doValidate = group === 'validate'

  /*
   * Handle settings delta
   */
  const delta =
    diffCheck(yaml.stringify(runningSettings), yaml.stringify(mSettings)).length > 1 ? true : false

  /*
   * Title and title icon
   */
  let title
  let Icon = SettingsIcon
  if (template.children?.[section]?.title) title = template.children[section].title
  else if (template.title) title = template.title
  else if (doValidate) {
    title = 'Validate Settings'
    Icon = CheckCircleIcon
  } else title = 'Update Settings'

  const showProps = doValidate
    ? { api, mSettings, deploy, validationReport, setValidationReport, setLoadingStatus }
    : {
        update,
        data: mSettings,
        sectionPath,
        template,
        group,
        section,
        loadView,
        setView,
        clearModal,
        pushModal,
      }
  const wrapProps = {
    title,
    Icon,
    section,
    sectionPath,
    doValidate,
    template,
    loadView,
    mSettings,
    preview,
    setPreview,
    dconf,
  }

  if (deployOngoing)
    return (
      <WizardWrapper {...wrapProps} title="Apply Settings">
        <Box color="success">
          <div className="flex flex-row items-center gap-2 text-success-content">
            <div className="w-6 h-6">
              <OkIcon className="w-6 h-6 text-success-content" stroke={4} />
            </div>
            Settings are being deployed
          </div>
        </Box>
        <p>Please wait as Morio applies the new settings.</p>
      </WizardWrapper>
    )

  const topBtnClasses = `btn btn-outline flex flex-row items-center justify-between flex-nowrap`

  return (
    <WizardWrapper {...wrapProps}>
      <div className="grid grid-cols-4 gap-2">
        <button
          className={`${topBtnClasses} btn-primary`}
          onClick={() => setShowDelta(true)}
          disabled={!delta}
        >
          <CompareIcon />
          {showDelta ? (
            <span>Hide diff</span>
          ) : (
            <span>
              Diff<span className="hidden 2xl:inline"> Settings</span>
            </span>
          )}
        </button>
        <button className={`${topBtnClasses} btn-primary`}>
          <SearchIcon />
          <span>
            Preview<span className="hidden 2xl:inline"> Settings</span>
          </span>
        </button>
        <button className={`${topBtnClasses} btn-success`} onClick={() => setView('validate')}>
          <CheckCircleIcon />
          <span>
            Validate<span className="hidden 2xl:inline"> Settings</span>
          </span>
        </button>
        <button className={`${topBtnClasses} btn-warning`} onClick={revert} disabled={!delta}>
          <ResetIcon />
          <span>
            Restore<span className="hidden 2xl:inline"> Settings</span>
          </span>
        </button>
      </div>
      {mSettings.preseed?.base ? (
        <Popout warning>
          <h5>These settings are preseeded</h5>
          <p>
            This Morio deployment uses preseeded settings. This means the settings are loaded from a
            remote system, typically a version control system like GitLab or GitHub.
          </p>
          <p>
            While you <b>can</b> update the settings here, those settings will be lost next time
            Morio is reseeded.
            <br />
            You probably should <b>update the preseeded setting instead</b>.
          </p>
        </Popout>
      ) : null}
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
          <p>The settings have been edited, and are now different from the deployed settings.</p>
          {showDelta ? (
            <div className="my-4 max-w-4xl overflow-scroll">
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
    </WizardWrapper>
  )
}
