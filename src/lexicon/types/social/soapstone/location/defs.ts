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
const id = 'social.soapstone.location.defs'

/** A geographic location expressed as an RFC 5870 geo URI (latitude and longitude, with optional altitude). */
export interface Location {
  $type?: 'social.soapstone.location.defs#location'
  /** A geo URI using a scheme defined by the Internet Engineering Task Force's RFC 5870 (published 8 June 2010). */
  uri: string
}

const hashLocation = 'location'

export function isLocation<V>(v: V) {
  return is$typed(v, id, hashLocation)
}

export function validateLocation<V>(v: V) {
  return validate<Location & V>(v, id, hashLocation)
}
