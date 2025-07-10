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
import type * as SocialSoapstoneMessageDefs from '../message/defs.js'
import type * as SocialSoapstoneLocationDefs from '../location/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'social.soapstone.feed.post'

export interface Record {
  $type: 'social.soapstone.feed.post'
  message: SocialSoapstoneMessageDefs.Message
  location: SocialSoapstoneLocationDefs.Location
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
