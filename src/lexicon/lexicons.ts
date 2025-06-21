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
  SocialSoapstoneActorDefs: {
    lexicon: 1,
    id: 'social.soapstone.actor.defs',
    defs: {
      profileViewMinimal: {
        type: 'object',
        required: ['did', 'handle'],
        properties: {
          did: {
            type: 'string',
            format: 'did',
          },
          handle: {
            type: 'string',
            format: 'handle',
          },
          displayName: {
            type: 'string',
            maxGraphemes: 64,
            maxLength: 640,
          },
          avatar: {
            type: 'string',
            format: 'uri',
          },
        },
      },
    },
  },
  SocialSoapstoneMessageDefs: {
    lexicon: 1,
    id: 'social.soapstone.message.defs',
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
            refs: ['lex:social.soapstone.message.en.defs#basePhrase'],
          },
          fill: {
            type: 'union',
            description: 'Fill phrase',
            refs: ['lex:social.soapstone.message.en.defs#fillPhrase'],
          },
        },
      },
      message: {
        type: 'array',
        description:
          'A message consisting of a series of bases phrases paired with fill phrases.',
        items: {
          type: 'ref',
          ref: 'lex:social.soapstone.message.defs#messagePart',
        },
      },
    },
  },
  SocialSoapstoneMessageEnDefs: {
    lexicon: 1,
    id: 'social.soapstone.message.en.defs',
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
  SocialSoapstoneLocationDefs: {
    lexicon: 1,
    id: 'social.soapstone.location.defs',
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
  SocialSoapstoneFeedDefs: {
    lexicon: 1,
    id: 'social.soapstone.feed.defs',
    defs: {
      postView: {
        type: 'object',
        required: ['uri', 'cid', 'author', 'record', 'indexedAt'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          cid: {
            type: 'string',
            format: 'cid',
          },
          author: {
            type: 'ref',
            ref: 'lex:social.soapstone.actor.defs#profileViewMinimal',
          },
          record: {
            type: 'ref',
            ref: 'lex:social.soapstone.feed.post',
          },
          positiveRatingsCount: {
            type: 'integer',
          },
          negativeRatingsCount: {
            type: 'integer',
          },
          indexedAt: {
            type: 'string',
            format: 'datetime',
          },
          viewer: {
            type: 'ref',
            ref: 'lex:social.soapstone.feed.defs#viewerState',
          },
        },
      },
      viewerState: {
        type: 'object',
        description:
          "Metadata about the requesting account's relationship with the subject content.",
        properties: {
          rating: {
            type: 'string',
            format: 'at-uri',
          },
        },
      },
    },
  },
  SocialSoapstoneFeedGetPosts: {
    lexicon: 1,
    id: 'social.soapstone.feed.getPosts',
    defs: {
      main: {
        type: 'query',
        description: 'Gets soapstone posts in a location',
        parameters: {
          type: 'params',
          required: ['location'],
          properties: {
            location: {
              type: 'string',
              description:
                "The requeter's current location as described by a geo URI, a scheme defined by the Internet Engineering Task Force's RFC 5870 (published 8 June 2010).",
              format: 'uri',
            },
            radius: {
              type: 'integer',
              description:
                'The radius in meters around the location to search for posts',
              minimum: 1,
              maximum: 1000,
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['posts'],
            properties: {
              posts: {
                type: 'array',
                items: {
                  type: 'ref',
                  ref: 'lex:social.soapstone.feed.defs#postView',
                },
              },
            },
          },
        },
      },
    },
  },
  SocialSoapstoneFeedPost: {
    lexicon: 1,
    id: 'social.soapstone.feed.post',
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
              ref: 'lex:social.soapstone.message.defs#message',
            },
            location: {
              type: 'ref',
              ref: 'lex:social.soapstone.location.defs#location',
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
  SocialSoapstoneFeedRating: {
    lexicon: 1,
    id: 'social.soapstone.feed.rating',
    defs: {
      main: {
        type: 'record',
        description:
          'Record declaring a positive or negative rating of a piece of subject content.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['message', 'value', 'createdAt', 'via'],
          properties: {
            message: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            value: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
            via: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
            },
          },
        },
      },
    },
  },
  ComAtprotoRepoStrongRef: {
    lexicon: 1,
    id: 'com.atproto.repo.strongRef',
    description: 'A URI with a content-hash fingerprint.',
    defs: {
      main: {
        type: 'object',
        required: ['uri', 'cid'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          cid: {
            type: 'string',
            format: 'cid',
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
  SocialSoapstoneActorDefs: 'social.soapstone.actor.defs',
  SocialSoapstoneMessageDefs: 'social.soapstone.message.defs',
  SocialSoapstoneMessageEnDefs: 'social.soapstone.message.en.defs',
  SocialSoapstoneLocationDefs: 'social.soapstone.location.defs',
  SocialSoapstoneFeedDefs: 'social.soapstone.feed.defs',
  SocialSoapstoneFeedGetPosts: 'social.soapstone.feed.getPosts',
  SocialSoapstoneFeedPost: 'social.soapstone.feed.post',
  SocialSoapstoneFeedRating: 'social.soapstone.feed.rating',
  ComAtprotoRepoStrongRef: 'com.atproto.repo.strongRef',
} as const
