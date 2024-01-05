import { fromEnv } from '#shared/env'
/*
 * Import the Validation controller
 */
import { Controller } from '#controllers/validate'

/*
 * Instantiate the controller
 */
const Validate = new Controller()

/**
 * This method adds the setup routes
 *
 * @param {object} A tools object from which we destructure the app object
 */
export function routes(tools) {
  const { app } = tools
  const PREFIX = fromEnv('MORIO_API_PREFIX')

  /*
   * Validates a Morio configuration
   */
  app.post(`${PREFIX}/validate/config`, (req, res) => Validate.configuration(req, res, tools))

  /*
   * Validates a (potential) Morio node
   */
  app.post(`${PREFIX}/validate/node`, (req, res) => Validate.node(req, res, tools))

  /*
   * Validates a ping (responding with the ping response code kept in state)
   */
  app.get(`${PREFIX}/validate/ping`, (req, res) => Validate.pong(req, res, tools))
}
