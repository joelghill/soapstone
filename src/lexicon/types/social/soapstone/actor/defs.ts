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

const is$typed = _is$typed,
  validate = _validate
const id = 'social.soapstone.actor.defs'

export interface ProfileViewMinimal {
  $type?: 'social.soapstone.actor.defs#profileViewMinimal'
  did: string
  handle: string
  displayName?: string
  avatar?: string
}

const hashProfileViewMinimal = 'profileViewMinimal'

export function isProfileViewMinimal<V>(v: V) {
  return is$typed(v, id, hashProfileViewMinimal)
}

export function validateProfileViewMinimal<V>(v: V) {
  return validate<ProfileViewMinimal & V>(v, id, hashProfileViewMinimal)
}
