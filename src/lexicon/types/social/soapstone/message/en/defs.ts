/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'social.soapstone.message.en.defs'

/** Base phrase for the message where the '****' is replaced with a fillPhrase value */
export type BasePhrase =
  | '**** ahead'
  | 'Be wary of ****'
  | 'Try ****'
  | 'Need ****'
/** Fill phrase for the message where the value replaces the '****' in the basePhrase */
export type FillPhrase = 'Enemy' | 'Tough enemy' | 'Hollow' | 'Soldier'
