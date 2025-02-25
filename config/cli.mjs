import { pkg } from './json-loader.mjs'
import path from 'path'
import 'dotenv/config'
import process from 'node:process'

/*
 * A little helper file with named exports to get access to a bunch of configuration values.
 *
 * This provides the following named exports:
 *
 *  - MORIO_ASCII_BANNER
 *  - MORIO_ABOUT
 *  - MORIO_GIT_ROOT
 *  - MORIO_GITHUB_REPO
 *  - MORIO_GITHUB_REPO_URL
 *  - MORIO_VERSION
 *  - MORIO_VERSION_TAG
 *  - MORIO_WEBSITE
 *  - MORIO_WEBSITE_URL
 *
 *  In addition, the following named exports can be changed
 *  by setting an environment variable with the same name:
 *
 *  - MORIO_DOCKER_LOG_DRIVER
 *  -  MORIO_DOCKER_ADD_HOST
 */

/*
 * Environment variables
 */
export const MORIO_DOCKER_LOG_DRIVER = process.env.MORIO_DOCKER_LOG_DRIVER || 'journald'
export const MORIO_DOCKER_ADD_HOST = process.env.MORIO_DOCKER_ADD_HOST || false

/*
 * About Morio
 */
export const MORIO_ABOUT = 'Morio provides the plumbing for your observability needs'

/*
 * Ascii banner
 */
export const MORIO_ASCII_BANNER = `

   _ _ _  ___  _ _  _  ___
  | ' ' |/ . \\| '_/| |/ . \\
  |_|_|_|\\___/|_|  |_|\\___/
`

/*
 * Location of the git repository on disk
 */
export const MORIO_GIT_ROOT = path.resolve(path.basename(import.meta.url), '..')

/*
 * Morio repository
 */
export const MORIO_GITHUB_REPO = 'certeu/morio'
export const MORIO_GITHUB_REPO_URL = 'https://github.com/certeu/morio'

/*
 * Morio version
 */
export const MORIO_VERSION = pkg.version

/*
 * Morio version tag
 */
export const MORIO_VERSION_TAG = `v${pkg.version}`

/*
 * Morio website
 */
export const MORIO_WEBSITE = 'morio.it'
export const MORIO_WEBSITE_URL = 'https://morio.it'
