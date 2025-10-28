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
import type * as ComAtprotoRepoDefs from '../../../com/atproto/repo/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'social.soapstone.feed.defs'

export interface PostView {
  $type?: 'social.soapstone.feed.defs#postView'
  uri: string
  /** The URI of the author of the post. */
  author_uri: string
  text: string
  location: string
  positiveRatingsCount?: number
  negativeRatingsCount?: number
  indexedAt: string
  viewer?: ViewerState
}

const hashPostView = 'postView'

export function isPostView<V>(v: V) {
  return is$typed(v, id, hashPostView)
}

export function validatePostView<V>(v: V) {
  return validate<PostView & V>(v, id, hashPostView)
}

/** Metadata about the requesting account's relationship with the subject content. */
export interface ViewerState {
  $type?: 'social.soapstone.feed.defs#viewerState'
  rating_uri?: string
  /** The rating value. True for positive rating, false for negative rating. */
  rating_value?: boolean
}

const hashViewerState = 'viewerState'

export function isViewerState<V>(v: V) {
  return is$typed(v, id, hashViewerState)
}

export function validateViewerState<V>(v: V) {
  return validate<ViewerState & V>(v, id, hashViewerState)
}

export interface CreatePostSchema {
  $type?: 'social.soapstone.feed.defs#createPostSchema'
  message: SocialSoapstoneMessageDefs.Message
  location: SocialSoapstoneLocationDefs.Location
}

const hashCreatePostSchema = 'createPostSchema'

export function isCreatePostSchema<V>(v: V) {
  return is$typed(v, id, hashCreatePostSchema)
}

export function validateCreatePostSchema<V>(v: V) {
  return validate<CreatePostSchema & V>(v, id, hashCreatePostSchema)
}

export interface CreatePostResponse {
  $type?: 'social.soapstone.feed.defs#createPostResponse'
  uri: string
  cid: string
  commit?: ComAtprotoRepoDefs.CommitMeta
  validationStatus?: 'valid' | 'unknown' | (string & {})
}

const hashCreatePostResponse = 'createPostResponse'

export function isCreatePostResponse<V>(v: V) {
  return is$typed(v, id, hashCreatePostResponse)
}

export function validateCreatePostResponse<V>(v: V) {
  return validate<CreatePostResponse & V>(v, id, hashCreatePostResponse)
}
