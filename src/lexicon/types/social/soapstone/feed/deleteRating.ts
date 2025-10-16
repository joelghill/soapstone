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
import type * as ComAtprotoRepoDefs from '../../../com/atproto/repo/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'social.soapstone.feed.deleteRating'

export type QueryParams = {}

export interface InputSchema {
  /** The Record Key of the rating to delete. */
  rkey: string
}

export interface OutputSchema {
  commit?: ComAtprotoRepoDefs.CommitMeta
}

export interface HandlerInput {
  encoding: 'application/json'
  body: InputSchema
}

export interface HandlerSuccess {
  encoding: 'application/json'
  body: OutputSchema
  headers?: { [key: string]: string }
}

export interface HandlerError {
  status: number
  message?: string
  error?: 'InvalidSwap'
}

export type HandlerOutput = HandlerError | HandlerSuccess
