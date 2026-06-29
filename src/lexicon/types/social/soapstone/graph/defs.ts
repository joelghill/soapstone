/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util'
import type * as SocialSoapstoneActorDefs from '../actor/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'social.soapstone.graph.defs'

/** An account that shares interactions with the requesting account, with counts of posts they have rated or discovered in common. */
export interface SharedInteractionsView {
  $type?: 'social.soapstone.graph.defs#sharedInteractionsView'
  actor: SocialSoapstoneActorDefs.ProfileViewMinimal
  /** Number of posts both accounts rated 'like'. */
  likesInCommon: number
  /** Number of posts both accounts rated 'dislike'. */
  dislikesInCommon: number
  /** Number of posts both accounts have interacted with (seen), regardless of rating. Superset that includes shared likes and dislikes. */
  discoveriesInCommon: number
}

const hashSharedInteractionsView = 'sharedInteractionsView'

export function isSharedInteractionsView<V>(v: V) {
  return is$typed(v, id, hashSharedInteractionsView)
}

export function validateSharedInteractionsView<V>(v: V) {
  return validate<SharedInteractionsView & V>(v, id, hashSharedInteractionsView)
}
