// Dependencies
import { capitalize, pageChildren, rbac } from 'lib/utils.mjs'
// Components
import {
  BriefcaseIcon,
  CertificateIcon,
  CheckCircleIcon,
  ClosedLockIcon,
  ComponentIcon,
  CodeIcon,
  CogIcon,
  ContainerIcon,
  ContainerImageIcon,
  DesktopIcon,
  DocumentIcon,
  DownloadIcon,
  FingerprintIcon,
  FixmeIcon,
  FlagIcon,
  FlipoverIcon,
  HardwareIcon,
  KeyIcon,
  LayersIcon,
  LocationIcon,
  LogsIcon,
  MorioIcon,
  NoteIcon,
  OpenLockIcon,
  PackageIcon,
  PlusCircleIcon,
  WindowIcon,
  QuestionIcon,
  RightIcon,
  SearchIcon,
  ServersIcon,
  SettingsIcon,
  StatusIcon,
  StorageIcon,
  TaskIcon,
  TipIcon,
  UlIcon,
  UserIcon,
  WifiIcon,
  WrenchIcon,
} from 'components/icons.mjs'
import { Docker, RedPanda, RedPandaConsole, Traefik } from 'components/brands.mjs'
import { Link } from 'components/link'

/*
 * Shared props for icons in the sidebar/navigation
 */
export const iconProps = { className: 'w-6 h-6 shrink-0 grow-0', stroke: 1.25 }

/*
 * Object to map icons to page
 */
const icons = {
  accounts: UserIcon,
  actions: WrenchIcon,
  api: CodeIcon,
  audit: FingerprintIcon,
  boards: FlipoverIcon,
  broker: RedPanda,
  ca: CertificateIcon,
  certificates: CertificateIcon,
  checks: CheckCircleIcon,
  create: PlusCircleIcon,
  core: MorioIcon,
  components: ComponentIcon,
  containers: ContainerIcon,
  console: RedPandaConsole,
  custom: FixmeIcon,
  dashboard: Traefik,
  decrypt: OpenLockIcon,
  docker: Docker,
  download: DownloadIcon,
  downloads: DownloadIcon,
  edit: NoteIcon,
  encrypt: ClosedLockIcon,
  events: FlagIcon,
  export: BriefcaseIcon,
  faq: QuestionIcon,
  hosts: ServersIcon,
  images: ContainerImageIcon,
  inventory: ServersIcon,
  ips: LocationIcon,
  kv: KeyIcon,
  logs: LogsIcon,
  macs: HardwareIcon,
  metrics: StatusIcon,
  morio: MorioIcon,
  networks: WifiIcon,
  nodes: ServersIcon,
  notes: TipIcon,
  oss: WindowIcon,
  pkgs: PackageIcon,
  presets: CheckCircleIcon,
  proxy: Traefik,
  reference: UlIcon,
  search: SearchIcon,
  services: LayersIcon,
  settings: SettingsIcon,
  show: DocumentIcon,
  tasks: TaskIcon,
  tools: CogIcon,
  ui: DesktopIcon,
  volumes: StorageIcon,
  status: StatusIcon,
  start: SettingsIcon,
}

/*
 * This object represents the navigation structure
 */
export const links = {
  actions: {
    t: 'Actions',
    r: 'operator',
  },
  boards: {
    t: 'Dashboards',
    r: 'user',
    audit: {
      t: 'Audit',
      r: 'user',
    },
    events: {
      t: 'Events',
      r: 'user',
    },
    checks: {
      t: 'Health Checks',
      r: 'user',
    },
    logs: {
      t: 'Logs',
      r: 'user',
    },
    metrics: {
      t: 'Metrics',
      r: 'user',
    },
    notes: {
      t: 'Notes',
      r: 'user',
    },
    //search: {
    //  t: 'Search Dashboards',
    //  r: 'user',
    //},
    //custom: {
    //  t: 'Custom Dashboards',
    //  r: 'user',
    //},
  },
  inventory: {
    t: 'Inventory',
    r: 'operator',
    hosts: {
      t: 'Hosts',
      r: 'user',
    },
    ips: {
      t: 'IP Addresses',
      r: 'user',
    },
    macs: {
      t: 'MAC Addresses',
      r: 'user',
    },
    oss: {
      t: 'Operating Systems',
      r: 'user',
    },
  },
  settings: {
    t: 'Settings',
    r: 'operator',
    edit: {
      t: 'Edit Settings',
    },
    show: {
      t: 'Show Settings',
    },
    presets: {
      t: 'Show Presets',
    },
    start: {
      t: 'Update Settings',
    },
  },
  status: {
    docker: {
      r: 'operator',
      containers: {},
      images: {},
      networks: {},
    },
    dashboard: {
      t: 'Traefik Dashboard',
      href: `/dashboard/?cache_bust=${String(Date.now()).slice(0, 8)}`,
      target: '_BLANK',
    },
    console: {
      t: 'RedPanda Console',
      href: `/console/`,
      target: '_BLANK',
      r: 'operator',
    },
  },
  tools: {
    accounts: {
      r: 'manager',
    },
    decrypt: {
      t: 'Decrypt Data',
      r: 'engineer',
    },
    downloads: {},
    encrypt: {
      t: 'Enrypt Data',
    },
    export: {
      t: 'Export Data',
    },
    kv: {
      t: 'Key/Value Store',
    },
    certificates: {
      t: 'X.509 Certificates',
    },
  },
}

const Null = () => null

/**
 * Helper method to determine whether a page is active, as in on the path to
 * the current page.
 *
 */
const isActive = (href, current) => `/${current.join('/')}`.slice(0, href.length) === href

/**
 * Icon that is shown on an open top-level entry
 */
const OpenIcon = () => <RightIcon className="w-6 h-6 shrink-0 grow-0 rotate-90" stroke={3} />

/**
 * This is a component to render a navigation button, which is an entry in the menu
 *
 * @param {object} subs - Any additional children (sub-pages) to render
 * @param {string} current - The current page
 * @param {string} k - The target page (key in the object)
 * @param {array} parents - The page's parents
 * @parem {function} onClick - Set this to make the element a button
 */
export const NavButton = ({
  k,
  page,
  current,
  parents,
  role,
  level = 0,
  onClick = false,
  href = false,
  target = '',
  extraClasses = 'lg:hover:bg-primary lg:hover:text-primary-content',
}) => {
  if (page.r && !rbac(role, page.r)) return null
  /*
   * Pre-calculate some things we need
   */
  if (!href) href = getHref(k, parents)
  const active = isActive(href, current)
  const children = pageChildren(page)
  const here = `/${current.join('/')}` === href
  const title = page.t || capitalize(k)
  const className = `w-full flex flex-row items-center px-4 py-2 rounded-r-lg ${extraClasses} ${
    active
      ? here
        ? 'bg-primary bg-opacity-30 font-bold text-base-content'
        : 'text-base-content '
      : ` text-base-content ${level > 0 ? 'font-thin text-sm italic' : 'font-medium'}`
  }`
  const span = (
    <span className="block grow text-left" style={{ paddingLeft: level * 8 + 'px' }}>
      {title}
    </span>
  )
  const Icon = active && !here ? OpenIcon : icons[k] || Null
  const sizedIcon =
    level > 0 ? (
      <Icon className="w-6 h-6 shrink-0 grow-0 opacity-80" stroke={1.5} />
    ) : (
      <Icon className="w-7 h-7 shrink-0 grow-0" stroke={1.25} />
    )

  /*
   * Return button if onClick is set, link if not
   */
  return onClick ? (
    <button {...{ onClick, className }} title={title}>
      {span}
      <div className="w-12">{sizedIcon}</div>
    </button>
  ) : (
    <>
      <Link {...{ href, className }} title={title} target={target}>
        {span}
        <div className="w-12 -mr-4 text-center flex items-center justify-center">{sizedIcon}</div>
      </Link>
      {active && children
        ? Object.entries(children).map(([key, page]) => (
            <NavButton
              key={key}
              {...{ page, current, role }}
              k={key}
              level={level + 1}
              parents={[...parents, k]}
              {...page}
            />
          ))
        : null}
    </>
  )
}

/**
 * Helper method to construct the href attribute
 *
 * @param {string} page - The page key in the nav object
 * @parent {array} parents - A list of page keys that are (grand) parents
 * @parent {string} slug - The page slug (alternative way to call this method)
 * @return {string} href - The href attribute to link to this page
 */
const getHref = (page, parents = [], slug = false) =>
  slug
    ? `/${slug.toLowerCase()}`
    : parents.length > 0
      ? `/${parents.join('/')}/${page}`.toLowerCase()
      : `/${page}`.toLowerCase()

/**
 * This is the MainMenu component that renders the main navigation menu
 *
 * It will call itself recursively when it encountes subs in the navs object
 *
 * @param {string} current - The slug of the current page (path without leading slash)
 * @param {object} navs - The navigation structure to render
 * @param {level} number - An integer indicating the depth, used when called recursively to indent
 * @param {array} parent - An array holding the parents of the current page, allowing to construct the href
 */
export const MainMenu = ({ role, current, navs = false, level = 0, parents = [] }) => {
  if (!navs) navs = links
  const list = []
  for (const [key, page] of Object.entries(navs))
    list.push(<NavButton page={page} k={key} key={key} {...{ role, current, parents, level }} />)

  return list
}
