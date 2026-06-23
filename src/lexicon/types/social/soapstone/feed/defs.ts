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

const is$typed = _is$typed,
  validate = _validate
const id = 'social.soapstone.feed.defs'

export interface PostView {
  $type?: 'social.soapstone.feed.defs#postView'
  uri: string
  cid: string
  /** The Handle or DID of the author of the post. */
  author_did: string
  text: string
  location: string
  positive_ratings?: number
  negative_ratings?: number
  created_at: string
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
