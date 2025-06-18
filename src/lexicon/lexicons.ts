/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  type LexiconDoc,
  Lexicons,
  ValidationError,
  type ValidationResult,
} from '@atproto/lexicon'
import { type $Typed, is$typed, maybe$typed } from './util.js'

export const schemaDict = {
  SocialFlatlanderSoapstoneMessageDefs: {
    lexicon: 1,
    id: 'social.flatlander.soapstone.message.defs',
    defs: {
      messagePart: {
        type: 'object',
        description:
          'A message part consisting of a base phrase and a fill phrase.',
        required: ['base', 'fill'],
        properties: {
          base: {
            type: 'union',
            description: 'Base phrase',
            refs: [
              'lex:social.flatlander.soapstone.message.en.defs#basePhrase',
            ],
          },
          fill: {
            type: 'union',
            description: 'Fill phrase',
            refs: [
              'lex:social.flatlander.soapstone.message.en.defs#fillPhrase',
            ],
          },
        },
      },
      message: {
        type: 'array',
        description:
          'A message consisting of a series of bases phrases paired with fill phrases.',
        items: {
          type: 'ref',
          ref: 'lex:social.flatlander.soapstone.message.defs#messagePart',
        },
      },
    },
  },
  SocialFlatlanderSoapstoneMessage: {
    lexicon: 1,
    id: 'social.flatlander.soapstone.message',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['text', 'location', 'createdAt'],
          properties: {
            text: {
              type: 'ref',
              ref: 'lex:social.flatlander.soapstone.message.defs#message',
            },
            location: {
              type: 'ref',
              ref: 'lex:social.flatlander.soapstone.location.defs#location',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  SocialFlatlanderSoapstoneMessageEnDefs: {
    lexicon: 1,
    id: 'social.flatlander.soapstone.message.en.defs',
    defs: {
      basePhrase: {
        type: 'string',
        description:
          "Base phrase for the message where the '****' is replaced with a fillPhrase value",
        enum: ['**** ahead', 'Be wary of ****', 'Try ****', 'Need ****'],
      },
      fillPhrase: {
        type: 'string',
        description:
          "Fill phrase for the message where the value replaces the '****' in the basePhrase",
        enum: ['Enemy', 'Tough enemy', 'Hollow', 'Soldier'],
      },
    },
  },
  SocialFlatlanderSoapstoneLocationDefs: {
    lexicon: 1,
    id: 'social.flatlander.soapstone.location.defs',
    defs: {
      location: {
        type: 'object',
        description: 'A location in a 3D reference system.',
        required: ['uri'],
        properties: {
          uri: {
            type: 'string',
            format: 'uri',
            description:
              "A geo URI using a scheme defined by the Internet Engineering Task Force's RFC 5870 (published 8 June 2010).",
          },
        },
      },
    },
  },
} as const satisfies Record<string, LexiconDoc>
export const schemas = Object.values(schemaDict) satisfies LexiconDoc[]
export const lexicons: Lexicons = new Lexicons(schemas)

export function validate<T extends { $type: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType: true,
): ValidationResult<T>
export function validate<T extends { $type?: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: false,
): ValidationResult<T>
export function validate(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: boolean,
): ValidationResult {
  return (requiredType ? is$typed : maybe$typed)(v, id, hash)
    ? lexicons.validate(`${id}#${hash}`, v)
    : {
        success: false,
        error: new ValidationError(
          `Must be an object with "${hash === 'main' ? id : `${id}#${hash}`}" $type property`,
        ),
      }
}

export const ids = {
  SocialFlatlanderSoapstoneMessageDefs:
    'social.flatlander.soapstone.message.defs',
  SocialFlatlanderSoapstoneMessage: 'social.flatlander.soapstone.message',
  SocialFlatlanderSoapstoneMessageEnDefs:
    'social.flatlander.soapstone.message.en.defs',
  SocialFlatlanderSoapstoneLocationDefs:
    'social.flatlander.soapstone.location.defs',
} as const
