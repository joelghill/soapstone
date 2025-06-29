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
import type * as SocialSoapstoneActorDefs from '../actor/defs.js'
import type * as SocialSoapstoneFeedPost from './post.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'social.soapstone.feed.defs'

export interface PostView {
  $type?: 'social.soapstone.feed.defs#postView'
  uri: string
  cid: string
  author: SocialSoapstoneActorDefs.ProfileViewMinimal
  record: SocialSoapstoneFeedPost.Main
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
  rating?: string
}

const hashViewerState = 'viewerState'

export function isViewerState<V>(v: V) {
  return is$typed(v, id, hashViewerState)
}

export function validateViewerState<V>(v: V) {
  return validate<ViewerState & V>(v, id, hashViewerState)
}
