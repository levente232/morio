import { setTimeout } from 'node:timers/promises'
import _get from 'lodash/get.js'
import _set from 'lodash/set.js'

/*
 * Re-export these lodash helpers
 */
export const get = _get
export const set = _set

/**
 * Capitalize the first character of a string
 *
 * @param {string} string - The string to capitalize
 * @return {string} result - The string with its first character capitalized
 */
export function capitalize(string) {
  return typeof string === 'string' ? string.charAt(0).toUpperCase() + string.slice(1) : ''
}

/**
 * Clone a data structure in a way that ensures no references
 * are kept, and it's just a plain old javascript object (pojo)
 *
 * @param {object} obj - The object to clone
 */
export function cloneAsPojo(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * A set helper that will only set if there's no value yet
 *
 * @param {object} obj - The object to mutate
 * @param {string|array} path - The path/key to update
 * @param {mixed} value - The value to set, if it is currently not set
 * @return {obhect} obj - The mutated object
 */
export function setIfUnset(obj, path, val) {
  if (typeof get(obj, path) === 'undefined') set(obj, path, val)

  return obj
}

/**
 * Reverses a string
 *
 * @param {string} str - The input string
 * @return {string} rts - The reversed string
 */
export function reverseString(str) {
  return str.split('').reverse().join('')
}

/**
 * Sleeps for a number of seconds in an async way
 *
 * This is a helper method to wait for a given amount of time
 * without blocking the even loop. This is typically used to
 * give containers time to spin up, and so on
 *
 * @param {number} seconds - Time to sleep in seconds
 * @return {promise} result - Returns a promise
 */
export async function sleep(seconds) {
  return await setTimeout(seconds * 1000)
}

/*
 * This method will continue attempting to get a truthy result every seconds until timeout
 *
 * @param {object} opts - An object controlling how this method behaves
 * @param {number} opts.every - Number of seconds to run the interval on
 * @param {number} opts.timeout - Number of seconds after which to give up
 * @param {function} opts.run - Method to run on each interval
 * @param {function} opts.onFailedAttempt - Callback to run when an attempt fails
 * @param {function} opts.validate - Optional method to run to see whether the
 *  result is successfull (if no message is passed, it will just see whether
 *  it's truthy)
 * @param {function} opts.log - Optional methods to log errors
 *
 * @return {promise} result - The promise
 */
export async function attempt({
  every = 2,
  timeout = 60,
  run,
  onFailedAttempt = false,
  validate = false,
}) {
  return new Promise((resolve) =>
    tryWhilePromiseResolver({ every, timeout, run, onFailedAttempt, validate }, resolve)
  )
}

/*
 * Promise resolver functions should not be async
 * so this method is here to side-step that
 */
async function tryWhilePromiseResolver(
  { every, timeout, run, onFailedAttempt, validate },
  resolve
) {
  /*
   * Quick check
   */
  let ok
  try {
    ok = await run()
  } catch (err) {
    // Log error if error was passed in
    console.log(err)
  }

  if ((typeof validate === 'function' && validate(ok)) || (typeof validate !== 'function' && ok))
    return resolve(ok)

  /*
   * Keep trying until timeout
   */
  const now = Date.now()
  const interval = setInterval(async () => {
    let ok
    try {
      ok = await run()
    } catch (err) {
      console.log(err)
    }
    if (ok) {
      clearInterval(interval)
      return resolve(ok)
    } else {
      const delta = (Date.now() - now) / 1000
      if (delta > timeout) {
        clearInterval(interval)
        return resolve(false)
      } else if (onFailedAttempt && typeof onFailedAttempt === 'function')
        onFailedAttempt(Math.floor(delta))
    }
  }, every * 1000)
}

/**
 * Wrap express with proper signal handling
 *
 * @param {object} log - A logger instance
 * @param {object} server - The Express server instance
 * @return {object} server - The Express server instance
 */
export function wrapExpress(log, server) {
  /*
   * These are the signals we want to handle
   */
  const signals = {
    SIGHUP: 1,
    SIGINT: 2,
    SIGTERM: 15,
  }

  /*
   * This method will be called on shutdown
   */
  const shutdown = (signal, value) => {
    log.info(`Received a ${signal} signal. Initiating shutdown.`)
    server.close(() => {
      /*
       * Wave goodbye
       */
      log.info(`Shutdown finalized. Exiting.`)
      process.exit(128 + value) /* eslint-disable-line no-undef */
    })
  }

  /*
   * Create a listener for the different signals we want to handle
   */
  Object.keys(signals).forEach((signal) => {
    process.on(signal, () => shutdown(signal, signals[signal])) /* eslint-disable-line no-undef */
  })

  return server
}
