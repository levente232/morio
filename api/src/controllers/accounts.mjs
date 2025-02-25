import { isRoleAvailable, currentUser } from '../rbac.mjs'
import { randomString, hash, hashPassword } from '#shared/crypto'
import { log, utils } from '../lib/utils.mjs'
import { clean, listAccounts, loadAccount, saveAccount } from '../lib/account.mjs'
import { mfa } from '../lib/mfa.mjs'

/**
 * This account controller handles accounts in Morio
 *
 * @returns {object} Controller - The account controller object
 */
export function Controller() {}

/**
 * List accounts
 *
 * This lists all accounts known to Morio.
 * An account can be either a local account (this one has the most
 * features) or on login via an identity provider, an account is
 * also created.
 *
 * @param {object} req - The request object from Express
 * @param {object} res - The response object from Express
 */
Controller.prototype.list = async function (req, res) {
  /*
   * Check user
   */
  const user = currentUser(req)
  if (!user) return utils.sendErrorResponse(res, 'morio.api.authentication.required', req.url)

  // TODO: Limit this based on role
  const accounts = await listAccounts()

  return res.send(accounts)
}

/**
 * Create account
 *
 * The only type you can create is a local account.
 *
 * @param {object} req - The request object from Express
 * @param {string} req.body.username - The username
 * @param {string} req.body.about - Info about the account (optional)
 * @param {string} req.body.provider - The provider (local)
 * @param {object} res - The response object from Express
 */
Controller.prototype.create = async function (req, res) {
  /*
   * Check user
   */
  const user = currentUser(req)
  if (!user) return utils.sendErrorResponse(res, 'morio.api.authentication.required', req.url)

  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.account.create`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Does this user exist?
   */
  const exists = await loadAccount(valid.provider, valid.username)
  if (exists) {
    /*
     * A user with sufficient privileges can overwrite the account
     */
    if (valid.overwrite && isRoleAvailable(req, 'operator')) {
      log.debug(`Overwriting ${valid.provider}.${valid.username}`)
    } else return utils.sendErrorResponse(res, 'morio.api.account.exists', req.url)
  }

  /*
   * Create the account
   */
  const invite = randomString(24)
  await saveAccount(valid.provider, valid.username, {
    about: valid.about,
    provider: valid.provider,
    invite: hash(invite),
    status: 'pending',
    role: valid.role,
    created_by: currentUser(req),
    created_at: Date.now(),
  })

  return res.send({
    ...valid,
    // Make sure to returned the cleaned version of the username
    username: clean(valid.username),
    invite,
    inviteUrl: `https://${utils.getClusterFqdn()}/morio/invite/${valid.username}-${invite}`,
  })
}

/**
 * Activate account
 *
 * The only type you can activate is a local account.
 * Note that this does not actually activate the account (yet).
 * Instead, it sets up MFA. When that is activated/configure, the
 * account becomes active. See activateMfa()
 *
 * @param {object} req - The request object from Express
 * @param {string} req.body.invite - The invite code
 * @param {string} req.body.provider - The provider (local)
 * @param {object} res - The response object from Express
 */
Controller.prototype.activate = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.account.activate`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Does this account exist and is it in pending state??
   */
  const pending = await loadAccount('local', valid.username)
  if (!pending) return utils.sendErrorResponse(res, 'morio.api.account.unknown', req.url)
  if (pending.status !== 'pending')
    return utils.sendErrorResponse(res, 'morio.api.account.state.invalid', req.url)

  /*
   * Does the invite match?
   */
  if (pending.invite !== hash(req.body.invite))
    return utils.sendErrorResponse(res, 'morio.api.account.invite.mismatch', req.url)

  /*
   * MFA is mandatory for local accounts. So set it up
   */
  const result = await mfa.enroll(valid.username)

  /*
   * Update the account, with MFA secret
   */
  await saveAccount('local', valid.username, {
    ...pending,
    mfa: await utils.encrypt(result.secret),
  })

  /*
   * Return the QR code and other relevant data
   */
  return res.send(result)
}

/**
 * Activate MFA on an account
 *
 * The only type you can activate is a local account.
 * This actually activates the account after confirming MFA is
 * setup properly. It also generates scratch codes.
 *
 * @param {object} req - The request object from Express
 * @param {string} req.body.invite - The invite code
 * @param {string} req.body.provider - The provider (local)
 * @param {object} res - The response object from Express
 */
Controller.prototype.activateMfa = async function (req, res) {
  /*
   * Validate input
   */
  const [valid, err] = await utils.validate(`req.account.activatemfa`, req.body)
  if (!valid)
    return utils.sendErrorResponse(res, 'morio.api.schema.violation', req.url, {
      schema_violation: err.message,
    })

  /*
   * Does this account exist and is it in pending state with an MFA secret set?
   */
  const pending = await loadAccount('local', valid.username)
  if (!pending) return utils.sendErrorResponse(res, 'morio.api.account.unknown', req.url)
  if (pending.status !== 'pending' || !pending.mfa)
    return utils.sendErrorResponse(res, 'morio.api.account.state.invalid', req.url)

  /*
   * Does the invite match?
   */
  if (pending.invite !== hash(req.body.invite))
    return utils.sendErrorResponse(res, 'morio.api.account.invite.mismatch', req.url)

  /*
   * Verify MFA token
   */
  const result = await mfa.verify(valid.token, await utils.decrypt(pending.mfa))
  if (!result)
    return utils.sendErrorResponse(res, 'morio.api.account.credentials.mismatch', req.url)

  /*
   * Also generate scratch codes because we've all lost our phone at one point
   */
  const scratchCodes = [1, 2, 3].map(() => randomString(32))

  /*
   * Update the account, with scratch codes and pasword,  and set status to active
   * While we're at it, remove the invite code
   */
  const data = {
    ...pending,
    scratch_codes: scratchCodes.map((code) => hash(code)),
    password: hashPassword(valid.password),
    status: 'active',
  }
  delete data.invite
  await saveAccount('local', valid.username, data)

  /*
   * Return the scratch codes
   */
  return res.send({ scratch_codes: scratchCodes })
}
