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
import type * as ComAtprotoRepoStrongRef from '../../../com/atproto/repo/strongRef.js'
import type * as ComAtprotoRepoDefs from '../../../com/atproto/repo/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'social.soapstone.feed.createRating'

export type QueryParams = {}

export interface InputSchema {
  post: ComAtprotoRepoStrongRef.Main
  /** The rating value. True for positive rating, false for negative rating. */
  value: boolean
}

export interface OutputSchema {
  /** The URI of the created rating record. */
  uri: string
  /** The CID of the created rating record. */
  cid: string
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
  error?: 'InvalidPost' | 'DuplicateRating' | 'InvalidSwap'
}

export type HandlerOutput = HandlerError | HandlerSuccess
