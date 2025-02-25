import { minimatch } from 'minimatch'

/*
 * This returns a kv helper object
 *
 * @param {object} db - The database helper object
 * @param {object} log - The logger helper object
 * @return {object} kv - The KV helper object
 */
export function kv(db, log) {
  async function writeKey(key, val) {
    let result
    try {
      result = await db.write(`REPLACE INTO kv(key, val) VALUES(:key,:val)`, {
        key,
        val: JSON.stringify(val),
      })
    } catch (err) {
      log.warn(err, `Failed to write to KV table`)
    }

    return result[0] === 200 && result[1].results?.[0]?.rows_affected === 1 ? true : false
  }

  async function readKey(key) {
    let result
    try {
      result = await db.read(`SELECT val from kv WHERE key=:key`, { key })
    } catch (err) {
      log.warn(err, `Failed to read from KV table`)
    }

    /*
     * Handle keys that do not exist first
     */
    if (result[0] === 200 && typeof result[1].results?.[0].values === 'undefined')
      return [false, 404]

    let val = false
    if (result[0] === 200 && typeof result[1].results?.[0]?.values?.[0]?.[0] !== 'undefined') {
      try {
        val = JSON.parse(result[1].results[0].values[0][0])
      } catch (err) {
        log.warn(err, `Failed to parse result from KV read`)
        return [false, 'Failed to parse result as JSON']
      }

      return [val, null]
    }

    return [null, 'Read failed']
  }

  async function removeKey(key) {
    let result
    try {
      result = await db.write(`DELETE from kv WHERE key = :key`, { key })
    } catch (err) {
      log.warn(err, `Failed to remove key from KV table`)
    }

    /*
     * Handle keys that do not exist first
     */
    if (result[0] === 200 && typeof result[1].results?.[0].rows_affected === 'undefined') return 404
    return true
  }

  async function listKeys() {
    let result
    try {
      result = await db.read(`SELECT key from kv`)
    } catch (err) {
      log.warn(err, `Failed to list keys from KV table`)
    }

    if (result[0] === 200 && Array.isArray(result[1]?.results?.[0]?.values)) {
      return result[1].results[0].values.map((val) => val.pop())
    }

    return false
  }

  async function globKeys(pattern = '*') {
    const list = await listKeys()
    if (!Array.isArray(list)) return false

    return list.filter((val) => minimatch(val, pattern))
  }

  async function dumpKeyData() {
    let result
    try {
      result = await db.read(`SELECT key, val from kv`)
    } catch (err) {
      log.warn(err, `Failed to read from KV table`)
    }

    /*
     * Make sure it worked
     */
    if (result[0] !== 200) return false

    /*
     * Transform data to a POJO, then return
     */
    const data = {}
    if (Array.isArray(result[1].results?.[0]?.values)) {
      for (const [key, val] of result[1].results[0].values) data[key] = val
    }

    return data
  }

  return {
    set: writeKey,
    get: readKey,
    del: removeKey,
    ls: listKeys,
    glob: globKeys,
    dump: dumpKeyData,
  }
}
