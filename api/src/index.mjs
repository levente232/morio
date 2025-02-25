// Dependencies
import express from 'express'
import { wrapExpress } from '#shared/utils'
import { getPreset } from '#config'
import cookieParser from 'cookie-parser'
// Routes
import { routes } from '#routes/index'
// Bootstrap configuration
import { reloadConfiguration } from './reload.mjs'
// Middleware
import { guardRoutes, addRbacHeaders, session, limits } from './middleware.mjs'
// Load logger and utils
import { log, utils } from './lib/utils.mjs'

/*
 * Instantiate the Express app
 */
const app = express()

/*
 * Add support for JSON with a limit to the request body
 */
app.use(express.json({ limit: '1mb' }))

/*
 * Add middleware to guard routes while we are
 * in ephemeral mode or reloading
 */
app.use(guardRoutes)

/*
 * Add support for cookies with a limit to the request body
 */
app.use(cookieParser())

/*
 * Add custom middleware to load roles from header
 */
app.use(addRbacHeaders)

/*
 * We need to trust the proxy to allow proper rate limiting
 */
app.set('trust proxy', 1)

/*
 * Add rate limiting middleware and limits route
 */
app.use(limits)
app.get(`/limits`, async (req, res) => {
  const rate = await limits.getKey(req.ip)

  return res.send({
    ip: req.ip,
    hits: rate.totalHits,
    reset_time: rate.resetTime,
    reset_seconds: Math.ceil((new Date(rate.resetTime).getTime() - new Date().getTime()) / 1000),
  })
})

/*
 * Add session middleware to the authentication routes as
 * some identity providers (OIDC) require it.
 */
app.use('/login-form', session)
app.use(`/callback/oidc/:provider_id`, session)

/*
 * Add content type for full page form requests to routes who handle this
 */
app.use('/login-form', express.urlencoded({ extended: true }))

/*
 * Load the API routes
 */
for (const type in routes) routes[type](app)

/*
 * If not in production, allow access to coverage reports
 */
app.use(`/coverage/api`, express.static('/morio/api/coverage'))
app.use(`/coverage/core`, express.static('/morio/core/coverage'))

/*
 * Add downloads folder for serving static files
 */
app.use(`/downloads`, express.static(`/morio/${getPreset('MORIO_DOWNLOADS_FOLDER')}`))

/*
 * Add repos folder for serving repositories
 */
app.use(`/repos`, express.static(`/morio/${getPreset('MORIO_REPOS_FOLDER')}`))

/*
 * (Re)Load the API
 */
await reload()

/*
 * Start listening for requests
 */
wrapExpress(log, app.listen(getPreset('MORIO_API_PORT')))

/*
 * This method allows the API to dynamically reload its
 * own configuration
 */
export async function reload() {
  /*
   * Drop us in config resolving mode
   */
  utils.beginReload()

  /*
   * This does the actual reloading
   */
  await reloadConfiguration()

  /*
   * Let the world know we are ready
   */
  utils.endReload()
}
