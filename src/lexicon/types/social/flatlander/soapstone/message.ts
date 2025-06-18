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
import type * as SocialFlatlanderSoapstoneMessageDefs from './message/defs.js'
import type * as SocialFlatlanderSoapstoneLocationDefs from './location/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'social.flatlander.soapstone.message'

export interface Record {
  $type: 'social.flatlander.soapstone.message'
  text: SocialFlatlanderSoapstoneMessageDefs.Message
  location: SocialFlatlanderSoapstoneLocationDefs.Location
  createdAt: string
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}
