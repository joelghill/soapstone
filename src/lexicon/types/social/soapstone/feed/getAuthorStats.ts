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
const id = 'social.soapstone.feed.getAuthorStats'

export type QueryParams = {
  /** The account whose authored-post totals to fetch. Defaults to the authenticated account. */
  actor?: string
}
export type InputSchema = undefined

export interface OutputSchema {
  stats: SocialSoapstoneFeedDefs.InteractionStats
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
