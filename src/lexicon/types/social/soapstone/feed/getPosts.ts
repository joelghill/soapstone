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
const id = 'social.soapstone.feed.getPosts'

export type QueryParams = {
  /** The requeter's current location as described by a geo URI, a scheme defined by the Internet Engineering Task Force's RFC 5870 (published 8 June 2010). */
  location: string
  /** The radius in meters around the location to search for posts */
  radius?: number
}
export type InputSchema = undefined

export interface OutputSchema {
  posts: SocialSoapstoneFeedDefs.PostView[]
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
