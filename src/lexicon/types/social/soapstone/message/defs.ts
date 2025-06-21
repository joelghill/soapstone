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
import type * as SocialSoapstoneMessageEnDefs from './en/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'social.soapstone.message.defs'

/** A message part consisting of a base phrase and a fill phrase. */
export interface MessagePart {
  $type?: 'social.soapstone.message.defs#messagePart'
  base: $Typed<SocialSoapstoneMessageEnDefs.BasePhrase> | { $type: string }
  fill: $Typed<SocialSoapstoneMessageEnDefs.FillPhrase> | { $type: string }
}

const hashMessagePart = 'messagePart'

export function isMessagePart<V>(v: V) {
  return is$typed(v, id, hashMessagePart)
}

export function validateMessagePart<V>(v: V) {
  return validate<MessagePart & V>(v, id, hashMessagePart)
}

export type Message = MessagePart[]
