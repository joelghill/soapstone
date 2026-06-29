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
import type * as SocialSoapstoneFeedDefs from './defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'social.soapstone.feed.getInteractions'

export type QueryParams = {
  /** AT-URI of the post to list interactions for. */
  uri: string
  /** Optional CID pinning the specific post version. */
  cid?: string
  /** Maximum number of interactions to return. */
  limit: number
  /** Pagination cursor returned by a previous call. */
  cursor?: string
}
export type InputSchema = undefined

export interface OutputSchema {
  cursor?: string
  interactions: SocialSoapstoneFeedDefs.InteractionView[]
}

export type HandlerInput = void

export interface HandlerSuccess {
  encoding: 'application/json'
  body: OutputSchema
  headers?: { [key: string]: string }
}

export interface HandlerError {
  status: number
  message?: string
}

export type HandlerOutput = HandlerError | HandlerSuccess
