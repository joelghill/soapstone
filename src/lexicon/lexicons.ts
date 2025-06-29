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
  AppBskyActorProfile: {
    lexicon: 1,
    id: 'app.bsky.actor.profile',
    defs: {
      main: {
        type: 'record',
        description: 'A declaration of a Bluesky account profile.',
        key: 'literal:self',
        record: {
          type: 'object',
          properties: {
            displayName: {
              type: 'string',
              maxGraphemes: 64,
              maxLength: 640,
            },
            description: {
              type: 'string',
              description: 'Free-form profile description text.',
              maxGraphemes: 256,
              maxLength: 2560,
            },
            avatar: {
              type: 'blob',
              description:
                "Small image to be displayed next to posts from account. AKA, 'profile picture'",
              accept: ['image/png', 'image/jpeg'],
              maxSize: 1000000,
            },
            banner: {
              type: 'blob',
              description:
                'Larger horizontal image to display behind profile view.',
              accept: ['image/png', 'image/jpeg'],
              maxSize: 1000000,
            },
            labels: {
              type: 'union',
              description:
                'Self-label values, specific to the Bluesky application, on the overall account.',
              refs: ['lex:com.atproto.label.defs#selfLabels'],
            },
            joinedViaStarterPack: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            pinnedPost: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
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
  ComAtprotoLabelDefs: {
    lexicon: 1,
    id: 'com.atproto.label.defs',
    defs: {
      label: {
        type: 'object',
        description:
          'Metadata tag on an atproto resource (eg, repo or record).',
        required: ['src', 'uri', 'val', 'cts'],
        properties: {
          ver: {
            type: 'integer',
            description: 'The AT Protocol version of the label object.',
          },
          src: {
            type: 'string',
            format: 'did',
            description: 'DID of the actor who created this label.',
          },
          uri: {
            type: 'string',
            format: 'uri',
            description:
              'AT URI of the record, repository (account), or other resource that this label applies to.',
          },
          cid: {
            type: 'string',
            format: 'cid',
            description:
              "Optionally, CID specifying the specific version of 'uri' resource this label applies to.",
          },
          val: {
            type: 'string',
            maxLength: 128,
            description:
              'The short string name of the value or type of this label.',
          },
          neg: {
            type: 'boolean',
            description:
              'If true, this is a negation label, overwriting a previous label.',
          },
          cts: {
            type: 'string',
            format: 'datetime',
            description: 'Timestamp when this label was created.',
          },
          exp: {
            type: 'string',
            format: 'datetime',
            description:
              'Timestamp at which this label expires (no longer applies).',
          },
          sig: {
            type: 'bytes',
            description: 'Signature of dag-cbor encoded label.',
          },
        },
      },
      selfLabels: {
        type: 'object',
        description:
          'Metadata tags on an atproto record, published by the author within the record.',
        required: ['values'],
        properties: {
          values: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:com.atproto.label.defs#selfLabel',
            },
            maxLength: 10,
          },
        },
      },
      selfLabel: {
        type: 'object',
        description:
          'Metadata tag on an atproto record, published by the author within the record. Note that schemas should use #selfLabels, not #selfLabel.',
        required: ['val'],
        properties: {
          val: {
            type: 'string',
            maxLength: 128,
            description:
              'The short string name of the value or type of this label.',
          },
        },
      },
      labelValueDefinition: {
        type: 'object',
        description:
          'Declares a label value and its expected interpretations and behaviors.',
        required: ['identifier', 'severity', 'blurs', 'locales'],
        properties: {
          identifier: {
            type: 'string',
            description:
              "The value of the label being defined. Must only include lowercase ascii and the '-' character ([a-z-]+).",
            maxLength: 100,
            maxGraphemes: 100,
          },
          severity: {
            type: 'string',
            description:
              "How should a client visually convey this label? 'inform' means neutral and informational; 'alert' means negative and warning; 'none' means show nothing.",
            knownValues: ['inform', 'alert', 'none'],
          },
          blurs: {
            type: 'string',
            description:
              "What should this label hide in the UI, if applied? 'content' hides all of the target; 'media' hides the images/video/audio; 'none' hides nothing.",
            knownValues: ['content', 'media', 'none'],
          },
          defaultSetting: {
            type: 'string',
            description: 'The default setting for this label.',
            knownValues: ['ignore', 'warn', 'hide'],
            default: 'warn',
          },
          adultOnly: {
            type: 'boolean',
            description:
              'Does the user need to have adult content enabled in order to configure this label?',
          },
          locales: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:com.atproto.label.defs#labelValueDefinitionStrings',
            },
          },
        },
      },
      labelValueDefinitionStrings: {
        type: 'object',
        description:
          'Strings which describe the label in the UI, localized into a specific language.',
        required: ['lang', 'name', 'description'],
        properties: {
          lang: {
            type: 'string',
            description:
              'The code of the language these strings are written in.',
            format: 'language',
          },
          name: {
            type: 'string',
            description: 'A short human-readable name for the label.',
            maxGraphemes: 64,
            maxLength: 640,
          },
          description: {
            type: 'string',
            description:
              'A longer description of what the label means and why it might be applied.',
            maxGraphemes: 10000,
            maxLength: 100000,
          },
        },
      },
      labelValue: {
        type: 'string',
        knownValues: [
          '!hide',
          '!no-promote',
          '!warn',
          '!no-unauthenticated',
          'dmca-violation',
          'doxxing',
          'porn',
          'sexual',
          'nudity',
          'nsfl',
          'gore',
        ],
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
  ComAtprotoRepoDefs: {
    lexicon: 1,
    id: 'com.atproto.repo.defs',
    defs: {
      commitMeta: {
        type: 'object',
        required: ['cid', 'rev'],
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          rev: {
            type: 'string',
            format: 'tid',
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
  ComAtprotoRepoCreateRecord: {
    lexicon: 1,
    id: 'com.atproto.repo.createRecord',
    defs: {
      main: {
        type: 'procedure',
        description:
          'Create a single new post. Requires auth, implemented by App View.',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['text', 'location'],
            properties: {
              text: {
                type: 'ref',
                ref: 'lex:social.soapstone.message.defs#message',
              },
              location: {
                type: 'ref',
                ref: 'lex:social.soapstone.location.defs#location',
              },
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
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
              commit: {
                type: 'ref',
                ref: 'lex:com.atproto.repo.defs#commitMeta',
              },
              validationStatus: {
                type: 'string',
                knownValues: ['valid', 'unknown'],
              },
            },
          },
        },
        errors: [
          {
            name: 'InvalidGeoURI',
            description:
              'Indicates that the submitted location is not a valid Geo URI.',
          },
          {
            name: 'InvalidSwap',
            description:
              "Indicates that 'swapCommit' didn't match current repo commit.",
          },
        ],
      },
    },
  },
  SocialSoapstoneFeedDeletePost: {
    lexicon: 1,
    id: 'social.soapstone.feed.deletePost',
    defs: {
      main: {
        type: 'procedure',
        description:
          "Delete a soapstone post, or ensure it doesn't exist. Requires auth, implemented by App View.",
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['rkey'],
            properties: {
              rkey: {
                type: 'string',
                format: 'record-key',
                description: 'The Record Key.',
              },
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            properties: {
              commit: {
                type: 'ref',
                ref: 'lex:com.atproto.repo.defs#commitMeta',
              },
            },
          },
        },
        errors: [
          {
            name: 'InvalidSwap',
          },
        ],
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
  XyzStatusphereStatus: {
    lexicon: 1,
    id: 'xyz.statusphere.status',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['status', 'createdAt'],
          properties: {
            status: {
              type: 'string',
              minLength: 1,
              maxGraphemes: 1,
              maxLength: 32,
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
  AppBskyActorProfile: 'app.bsky.actor.profile',
  ComAtprotoLabelDefs: 'com.atproto.label.defs',
  ComAtprotoRepoStrongRef: 'com.atproto.repo.strongRef',
  ComAtprotoRepoDefs: 'com.atproto.repo.defs',
  SocialSoapstoneFeedPost: 'social.soapstone.feed.post',
  SocialSoapstoneFeedRating: 'social.soapstone.feed.rating',
  SocialSoapstoneFeedDefs: 'social.soapstone.feed.defs',
  SocialSoapstoneFeedGetPosts: 'social.soapstone.feed.getPosts',
  ComAtprotoRepoCreateRecord: 'com.atproto.repo.createRecord',
  SocialSoapstoneFeedDeletePost: 'social.soapstone.feed.deletePost',
  SocialSoapstoneLocationDefs: 'social.soapstone.location.defs',
  SocialSoapstoneMessageDefs: 'social.soapstone.message.defs',
  SocialSoapstoneMessageEnDefs: 'social.soapstone.message.en.defs',
  SocialSoapstoneActorDefs: 'social.soapstone.actor.defs',
  XyzStatusphereStatus: 'xyz.statusphere.status',
} as const
