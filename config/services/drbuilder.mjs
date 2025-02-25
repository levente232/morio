import { getContainerTagSuffix } from './index.mjs'

/*
 * Export a single method that resolves the service configuration
 */
export const resolveServiceConfiguration = ({ utils }) => {
  /*
   * Make it easy to test production containers in a dev environment
   */
  const PROD = utils.isProduction()
  const DIRS = {
    data: utils.getPreset('MORIO_DATA_ROOT'),
    dl: utils.getPreset('MORIO_DOWNLOADS_FOLDER'),
  }

  return {
    /**
     * Container configuration
     *
     * @param {object} config - The high-level Morio configuration
     * @return {object} container - The container configuration
     */
    container: {
      // Name to use for the running container
      container_name: 'drbuilder',
      // Image to run (different in dev)
      image: 'itsmorio/dbuilder',
      // Image tag (version) to run
      tag: utils.getPreset('MORIO_VERSION_TAG') + getContainerTagSuffix(utils),
      // Don't attach to the default network
      networks: { default: null },
      // Instead, attach to the morio network
      network: utils.getPreset('MORIO_NETWORK'),
      // Volumes
      volumes: PROD
        ? [
            `${DIRS.data}/installers/deb:/morio/repo/src`,
            `${DIRS.data}/${DIRS.dl}/installers/deb:/morio/repo/dist`,
            `${DIRS.data}/aptrepo:/repo`,
            `${utils.getPreset('MORIO_CONFIG_ROOT')}/drbuilder:/etc/drbuilder`,
          ]
        : [
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/data/installers/deb:/morio/repo/src`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/data/${DIRS.dl}/installers/deb:/morio/repo/dist`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/data/aptrepo:/repo`,
            `${utils.getPreset('MORIO_GIT_ROOT')}/data/config/drbuilder:/etc/drbuilder`,
          ],
      command: ['/entrypoint.sh', 'repo'],
      // Don't keep container after it exits
      ephemeral: true,
    },
  }
}

/*
 * These are the defaults that will be used to build the DEB client package.
 * You can override them by passing them in to the control method.
 */
export const packageDefaults = {
  Package: 'morio-repo',
  Source: 'morio-repo',
  Section: 'misc',
  Priority: 'optional',
  Architecture: 'all',
  Essential: 'no',
  Depends: [['apt-transport-https', '>=2']],
  'Installed-Size': 50000,
  Maintainer: 'CERT-EU <services@cert.europa.eu>',
  'Changed-By': 'Joost De Cock <joost.decock@cert.europa.eu>',
  Homepage: 'https://morio.it',
  Description: `Adds Morio repository and GPG key`,
  'Vcs-Git': 'https://github.com/certeu/morio -b main',
  Uploaders: ['Joost De Cock <joost.decock@cert.europa.eu>'],
  DetailedDescription: `Install this package to set up the apt
repository on your Morio collector. This allows you to install the
Morio client and its updates via the OS package manager.`,
}

/**
 * This generated a control file to build a DEB package.
 *
 * @param {object} settigns - Specific settings to build this package
 * @param {object} utils - The utils object from core
 * @param {string} type - The package to build (repo or client)
 * @return {string} controlFile - The control file contents
 */
export const resolveControlFile = (settings = {}, utils) => {
  const s = { ...packageDefaults, ...settings }

  /*
   * If no version is specified, use the Morio version
   */
  if (!s.Version) s.Version = utils.getVersion()

  /*
   * Add revision to version number
   */
  if (settings.Revision) {
    s.Version += `-${s.Revision}`
    delete s.Revision
  } else s.Version += `-0`

  /*
   * Construct more complex fields
   */
  const extra = [`Depends: ` + s.Depends.map((pkg) => `${pkg[0]} (${pkg[1]})`).join(', ')]
  delete s.Depends
  if (s.Uploaders.length > 0) extra.push(`Uploaders: ` + s.Uploaders.join(', '))
  delete s.Uploaders
  s.Description += '\n  ' + s.DetailedDescription.split('\n').join('\n  ')
  delete s.DetailedDescription

  /*
   * Return control file structure/contents
   */
  return [...Object.keys(s).map((key) => `${key}: ${s[key]}`), ...extra, ''].join('\n')
}
