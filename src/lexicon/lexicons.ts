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
          required: ['message', 'location', 'createdAt'],
          properties: {
            message: {
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
        required: ['uri', 'author_uri', 'text', 'location', 'indexedAt'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          author_uri: {
            type: 'string',
            format: 'at-uri',
            description: 'The URI of the author of the post.',
          },
          text: {
            type: 'string',
          },
          location: {
            type: 'string',
            format: 'uri',
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
      createPostSchema: {
        type: 'object',
        required: ['message', 'location'],
        properties: {
          message: {
            type: 'ref',
            ref: 'lex:social.soapstone.message.defs#message',
          },
          location: {
            type: 'ref',
            ref: 'lex:social.soapstone.location.defs#location',
          },
        },
      },
      createPostResponse: {
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
  SocialSoapstoneFeedDefsCreatePost: {
    lexicon: 1,
    id: 'social.soapstone.feed.defs.createPost',
    defs: {
      main: {
        type: 'procedure',
        description:
          'Create a single new post. Requires auth, implemented by App View.',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'ref',
            ref: 'lex:social.soapstone.feed.defs#createPostSchema',
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'ref',
            ref: 'lex:social.soapstone.feed.defs#createPostResponse',
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
  SocialSoapstoneFeedCreateRating: {
    lexicon: 1,
    id: 'social.soapstone.feed.createRating',
    defs: {
      main: {
        type: 'procedure',
        description:
          'Create a rating for a post. Requires auth, implemented by App View.',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['post', 'value'],
            properties: {
              post: {
                type: 'ref',
                ref: 'lex:com.atproto.repo.strongRef',
                description: 'Reference to the post being rated.',
              },
              value: {
                type: 'boolean',
                description:
                  'The rating value. True for positive rating, false for negative rating.',
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
                description: 'The URI of the created rating record.',
              },
              cid: {
                type: 'string',
                format: 'cid',
                description: 'The CID of the created rating record.',
              },
              commit: {
                type: 'ref',
                ref: 'lex:com.atproto.repo.defs#commitMeta',
              },
            },
          },
        },
        errors: [
          {
            name: 'InvalidPost',
            description:
              'The referenced post does not exist or is not accessible.',
          },
          {
            name: 'DuplicateRating',
            description: 'User has already rated this post.',
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
  SocialSoapstoneFeedDeleteRating: {
    lexicon: 1,
    id: 'social.soapstone.feed.deleteRating',
    defs: {
      main: {
        type: 'procedure',
        description:
          "Delete a rating, or ensure it doesn't exist. Requires auth, implemented by App View.",
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['rkey'],
            properties: {
              rkey: {
                type: 'string',
                format: 'record-key',
                description: 'The Record Key of the rating to delete.',
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
            description:
              "Indicates that 'swapCommit' didn't match current repo commit.",
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
            refs: ['lex:social.soapstone.text.en#basePhrases'],
          },
          fill: {
            type: 'union',
            refs: [
              'lex:social.soapstone.text.en#characters',
              'lex:social.soapstone.text.en#objects',
              'lex:social.soapstone.text.en#techniques',
              'lex:social.soapstone.text.en#actions',
              'lex:social.soapstone.text.en#geography',
              'lex:social.soapstone.text.en#orientation',
              'lex:social.soapstone.text.en#bodyParts',
              'lex:social.soapstone.text.en#attributes',
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
          ref: 'lex:social.soapstone.message.defs#messagePart',
        },
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
  SocialSoapstoneTextEn: {
    lexicon: 1,
    id: 'social.soapstone.text.en',
    defs: {
      basePhrases: {
        type: 'string',
        description:
          "Base phrase for the message where the '****' is replaced with a fillPhrase value",
        enum: [
          '**** ahead',
          'Be wary of ****',
          'Try ****',
          'Need ****',
          'Imminent ****...',
          'Weakness:****',
          '****',
          '****?',
          'Good Luck',
          'I did it!',
          'Here!',
          "I can't take this...",
          'Praise the Sun!',
        ],
      },
      characters: {
        type: 'string',
        description: 'Character types that can be used in the fill phrase',
        enum: [
          'Enemy',
          'Tough enemy',
          'Hollow',
          'Soldier',
          'Knight',
          'Sniper',
          'Caster',
          'Giant',
          'Skeleton',
          'Ghost',
          'Bug',
          'Poison bug',
          'Lizard',
          'Drake',
          'Flier',
          'Golem',
          'Statue',
          'Monster',
          'Strange creature',
          'Demon',
          'Darkwraith',
          'Dragon',
          'Boss',
        ],
      },
      objects: {
        type: 'string',
        description: 'Objects that can be used in the fill phrase',
        enum: [
          'Bonfire',
          'Fog wall',
          'Humanity',
          'Lever',
          'Switch',
          'Key',
          'Treasure',
          'Chest',
          'Weapon',
          'Shield',
          'Projectile',
          'Armour',
          'Item',
          'Ring',
          'Sorcery scroll',
          'Pyromancy scroll',
          'Miracle scroll',
          'Ember',
          'Trap',
          'Covenant',
          'Amazing key',
          'Amazing treasure',
          'Amazing chest',
          'Amazing weapon',
          'Amazing shield',
          'Amazing projectile',
          'Amazing armour',
          'Amazing item',
          'Amazing ring',
          'Amazing sorcery scroll',
          'Amazing pyromancy scroll',
          'Amazing miracle scroll',
          'Amazing ember',
          'Amazing trap',
        ],
      },
      techniques: {
        type: 'string',
        description: 'Techniques that can be used in the fill phrase',
        enum: [
          'Close-ranged battle',
          'Ranged battle',
          'Eliminating one at a time',
          'Luring it out',
          'Beating to a pulp',
          'Lying in ambush',
          'Stealth',
          'Mimicry',
          'Pincer attack',
          'Hitting them in one swoop',
          'Fleeing',
          'Charging',
          'Stabbing in the back',
          'Sweeping attack',
          'Shield breaking',
          'Head shots',
          'Sorcery',
          'Pyromancy',
          'Miracles',
          'Jumping off',
          'Sliding down',
          'Dashing through',
        ],
      },
      actions: {
        type: 'string',
        description: 'Action types that can be used in the fill phrase',
        enum: [
          'Rolling',
          'Backstepping',
          'Jumping',
          'Attacking',
          'Holding with both hands',
          'Kicking',
          'A plunging attack',
          'Blocking',
          'Parrying',
          'Locking-on',
        ],
      },
      geography: {
        type: 'string',
        description: 'Geography types that can be used in the fill phrase',
        enum: [
          'Path',
          'Hidden path',
          'Shortcut',
          'Detour',
          'Illusionary wall',
          'Shortcut',
          'Dead end',
          'Swamp',
          'Lava',
          'Forest',
          'Cave',
          'Labyrinth',
          'Safe zone',
          'Danger zone',
          'Sniper spot',
          'Bright spot',
          'Dark spot',
          'Open area',
          'Tight spot',
          'Hidden place',
          'Exchange',
          'Gorgeous view',
          'Fall',
        ],
      },
      orientation: {
        type: 'string',
        description: 'Orientation types that can be used in the fill phrase',
        enum: [
          'Front',
          'Back',
          'Left',
          'Right',
          'Up',
          'Down',
          'Feet',
          'Head',
          'Back',
        ],
      },
      bodyParts: {
        type: 'string',
        description: 'Body parts that can be used in the fill phrase',
        enum: [
          'Head',
          'Neck',
          'Stomach',
          'Back',
          'Arm',
          'Leg',
          'Heel',
          'Rear',
          'Tail',
          'Wings',
          'Anywhere',
        ],
      },
      attributes: {
        type: 'string',
        description: 'Attributes that can be used in the fill phrase',
        enum: [
          'Strike',
          'Thrust',
          'Slash',
          'Magic',
          'Fire',
          'Lightning',
          'Critical hits',
          'Bleeding',
          'Poison',
          'Strong poison',
          'Curses',
          'Divine',
          'Occult',
          'Crystal',
        ],
      },
    },
  },
  SocialSoapstoneTextGetBasePhrases: {
    lexicon: 1,
    id: 'social.soapstone.text.getBasePhrases',
    defs: {
      main: {
        type: 'query',
        description:
          'Gets all available base phrases for message construction.',
        parameters: {
          type: 'params',
          properties: {
            language: {
              type: 'string',
              description:
                "Language code for the base phrases. Defaults to 'en' if not specified.",
              default: 'en',
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: ['basePhrases'],
            properties: {
              basePhrases: {
                type: 'array',
                description: 'Array of all available base phrases',
                items: {
                  type: 'union',
                  refs: ['lex:social.soapstone.text.en#basePhrases'],
                },
              },
            },
          },
        },
      },
    },
  },
  SocialSoapstoneTextGetFillPhrases: {
    lexicon: 1,
    id: 'social.soapstone.text.getFillPhrases',
    defs: {
      main: {
        type: 'query',
        description:
          'Gets all available fill phrases organized by category for message construction.',
        parameters: {
          type: 'params',
          properties: {
            language: {
              type: 'string',
              description:
                "Language code for the fill phrases. Defaults to 'en' if not specified.",
              default: 'en',
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            required: [
              'characters',
              'objects',
              'techniques',
              'actions',
              'geography',
              'orientation',
              'bodyParts',
              'attributes',
            ],
            properties: {
              characters: {
                type: 'array',
                description: 'Character types that can be used in fill phrases',
                items: {
                  type: 'union',
                  refs: ['lex:social.soapstone.text.en#characters'],
                },
              },
              objects: {
                type: 'array',
                description: 'Objects that can be used in fill phrases',
                items: {
                  type: 'union',
                  refs: ['lex:social.soapstone.text.en#objects'],
                },
              },
              techniques: {
                type: 'array',
                description: 'Techniques that can be used in fill phrases',
                items: {
                  type: 'union',
                  refs: ['lex:social.soapstone.text.en#techniques'],
                },
              },
              actions: {
                type: 'array',
                description: 'Actions that can be used in fill phrases',
                items: {
                  type: 'union',
                  refs: ['lex:social.soapstone.text.en#actions'],
                },
              },
              geography: {
                type: 'array',
                description: 'Geography types that can be used in fill phrases',
                items: {
                  type: 'union',
                  refs: ['lex:social.soapstone.text.en#geography'],
                },
              },
              orientation: {
                type: 'array',
                description:
                  'Orientation types that can be used in fill phrases',
                items: {
                  type: 'union',
                  refs: ['lex:social.soapstone.text.en#orientation'],
                },
              },
              bodyParts: {
                type: 'array',
                description: 'Body parts that can be used in fill phrases',
                items: {
                  type: 'union',
                  refs: ['lex:social.soapstone.text.en#bodyParts'],
                },
              },
              attributes: {
                type: 'array',
                description: 'Attributes that can be used in fill phrases',
                items: {
                  type: 'union',
                  refs: ['lex:social.soapstone.text.en#attributes'],
                },
              },
            },
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
  SocialSoapstoneFeedDefsCreatePost: 'social.soapstone.feed.defs.createPost',
  SocialSoapstoneFeedDeletePost: 'social.soapstone.feed.deletePost',
  SocialSoapstoneFeedCreateRating: 'social.soapstone.feed.createRating',
  SocialSoapstoneFeedDeleteRating: 'social.soapstone.feed.deleteRating',
  SocialSoapstoneLocationDefs: 'social.soapstone.location.defs',
  SocialSoapstoneMessageDefs: 'social.soapstone.message.defs',
  SocialSoapstoneActorDefs: 'social.soapstone.actor.defs',
  SocialSoapstoneTextEn: 'social.soapstone.text.en',
  SocialSoapstoneTextGetBasePhrases: 'social.soapstone.text.getBasePhrases',
  SocialSoapstoneTextGetFillPhrases: 'social.soapstone.text.getFillPhrases',
  XyzStatusphereStatus: 'xyz.statusphere.status',
} as const
