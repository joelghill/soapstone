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
import type * as SocialSoapstoneLocationDefs from '../location/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'social.soapstone.feed.defs'

/** A hydrated view of a soapstone post, including its author, rendered text, location, and aggregate interaction counts. */
export interface PostView {
  $type?: 'social.soapstone.feed.defs#postView'
  uri: string
  cid: string
  author: SocialSoapstoneActorDefs.ProfileViewMinimal
  /** The post's message rendered to a display string. */
  text: string
  location: SocialSoapstoneLocationDefs.Location
  /** Number of interactions rated 'like'. */
  likes?: number
  /** Number of interactions rated 'dislike'. */
  dislikes?: number
  /** Total number of interactions (accounts that have seen the post), including those that also rated it. */
  discoveries?: number
  createdAt: string
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
  /** AT-URI of the requesting account's interaction record for this post, if one exists. Presence indicates the account has seen the post. */
  interaction?: string
  /** The requesting account's rating of the post, if any. Absent means seen but not rated. */
  rating?: 'like' | 'dislike' | (string & {})
}

const hashViewerState = 'viewerState'

export function isViewerState<V>(v: V) {
  return is$typed(v, id, hashViewerState)
}

export function validateViewerState<V>(v: V) {
  return validate<ViewerState & V>(v, id, hashViewerState)
}

/** A view of another account's interaction with a post, including how they rated it (if at all). */
export interface InteractionView {
  $type?: 'social.soapstone.feed.defs#interactionView'
  actor: SocialSoapstoneActorDefs.ProfileViewMinimal
  /** The account's rating of the post, if any. Absent means seen but not rated. */
  rating?: 'like' | 'dislike' | (string & {})
  createdAt: string
}

const hashInteractionView = 'interactionView'

export function isInteractionView<V>(v: V) {
  return is$typed(v, id, hashInteractionView)
}

export function validateInteractionView<V>(v: V) {
  return validate<InteractionView & V>(v, id, hashInteractionView)
}

/** Aggregate interaction counts across one or more posts. */
export interface InteractionStats {
  $type?: 'social.soapstone.feed.defs#interactionStats'
  /** Number of interactions rated 'like'. */
  likes: number
  /** Number of interactions rated 'dislike'. */
  dislikes: number
  /** Total number of interactions (accounts that have seen the post), including those that also rated it. */
  discoveries: number
}

const hashInteractionStats = 'interactionStats'

export function isInteractionStats<V>(v: V) {
  return is$typed(v, id, hashInteractionStats)
}

export function validateInteractionStats<V>(v: V) {
  return validate<InteractionStats & V>(v, id, hashInteractionStats)
}
