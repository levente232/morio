/*
 * Pino is the logging library we use
 * See: https://github.com/pinojs/pino
 */
import pino from 'pino'

/*
 * Map textual log levels to their numeric value in pino
 */
const levels = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
  silent: Infinity,
}

/*
 * Export a function that takes the log level and returns the logger
 *
 * @param {string} level - The log level (see levels above)
 * @param {string} name - The name to log under
 * @return {object} logger - The logger
 */
export function logger(level = 'info', name) {
  return pino({
    name,
    level: levels[level] ? levels[level] : 30,
  })
}
