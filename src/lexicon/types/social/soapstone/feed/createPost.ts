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
const id = 'social.soapstone.feed.createPost'

export type QueryParams = {}
export type InputSchema = SocialSoapstoneFeedDefs.CreatePostSchema
export type OutputSchema = SocialSoapstoneFeedDefs.CreatePostResponse

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
  error?: 'InvalidGeoURI' | 'InvalidSwap'
}

export type HandlerOutput = HandlerError | HandlerSuccess
