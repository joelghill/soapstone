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
const id = 'social.soapstone.text.getFillPhrases'

export type QueryParams = {
  /** Language code for the fill phrases. Defaults to 'en' if not specified. */
  language: string
}
export type InputSchema = undefined

export interface OutputSchema {
  /** Character types that can be used in fill phrases */
  characters: string[]
  /** Objects that can be used in fill phrases */
  objects: string[]
  /** Techniques that can be used in fill phrases */
  techniques: string[]
  /** Actions that can be used in fill phrases */
  actions: string[]
  /** Geography types that can be used in fill phrases */
  geography: string[]
  /** Orientation types that can be used in fill phrases */
  orientation: string[]
  /** Body parts that can be used in fill phrases */
  bodyParts: string[]
  /** Attributes that can be used in fill phrases */
  attributes: string[]
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
