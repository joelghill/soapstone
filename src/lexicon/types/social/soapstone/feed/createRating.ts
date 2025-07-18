/**
 * GENERATED CODE - DO NOT MODIFY
 */
import express from 'express'
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util'
import { HandlerAuth, HandlerPipeThrough } from '@atproto/xrpc-server'
import type * as ComAtprotoRepoStrongRef from '../../../com/atproto/repo/strongRef.js'
import type * as ComAtprotoRepoDefs from '../../../com/atproto/repo/defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'social.soapstone.feed.createRating'

export interface QueryParams {}

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

export type HandlerOutput = HandlerError | HandlerSuccess | HandlerPipeThrough
export type HandlerReqCtx<HA extends HandlerAuth = never> = {
  auth: HA
  params: QueryParams
  input: HandlerInput
  req: express.Request
  res: express.Response
  resetRouteRateLimits: () => Promise<void>
}
export type Handler<HA extends HandlerAuth = never> = (
  ctx: HandlerReqCtx<HA>,
) => Promise<HandlerOutput> | HandlerOutput
