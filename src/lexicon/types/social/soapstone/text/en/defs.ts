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
const id = 'social.soapstone.text.en.defs'

export interface BasePhrase {
  $type?: 'social.soapstone.text.en.defs#basePhrase'
  /** Selected base phrase for the message where the '****' is replaced with a fillPhrase value */
  selection?:
    | '**** ahead'
    | 'Be wary of ****'
    | 'Try ****'
    | 'Need ****'
    | 'Imminent ****...'
    | 'Weakness:****'
    | '****'
    | '****?'
    | 'Good Luck'
    | 'I did it!'
    | 'Here!'
    | "I can't take this..."
    | 'Praise the Sun!'
}

const hashBasePhrase = 'basePhrase'

export function isBasePhrase<V>(v: V) {
  return is$typed(v, id, hashBasePhrase)
}

export function validateBasePhrase<V>(v: V) {
  return validate<BasePhrase & V>(v, id, hashBasePhrase)
}

/** Character types that can be used in conjunction with base phrases to form a complete message */
export interface Character {
  $type?: 'social.soapstone.text.en.defs#character'
  selection?:
    | 'Enemy'
    | 'Tough enemy'
    | 'Hollow'
    | 'Soldier'
    | 'Knight'
    | 'Sniper'
    | 'Caster'
    | 'Giant'
    | 'Skeleton'
    | 'Ghost'
    | 'Bug'
    | 'Poison bug'
    | 'Lizard'
    | 'Drake'
    | 'Flier'
    | 'Golem'
    | 'Statue'
    | 'Monster'
    | 'Strange creature'
    | 'Demon'
    | 'Darkwraith'
    | 'Dragon'
    | 'Boss'
}

const hashCharacter = 'character'

export function isCharacter<V>(v: V) {
  return is$typed(v, id, hashCharacter)
}

export function validateCharacter<V>(v: V) {
  return validate<Character & V>(v, id, hashCharacter)
}

/** Objects that can be used in conjunction with base phrases to form a complete message */
export interface Object {
  $type?: 'social.soapstone.text.en.defs#object'
  selection?:
    | 'Bonfire'
    | 'Fog wall'
    | 'Humanity'
    | 'Lever'
    | 'Switch'
    | 'Key'
    | 'Treasure'
    | 'Chest'
    | 'Weapon'
    | 'Shield'
    | 'Projectile'
    | 'Armour'
    | 'Item'
    | 'Ring'
    | 'Sorcery scroll'
    | 'Pyromancy scroll'
    | 'Miracle scroll'
    | 'Ember'
    | 'Trap'
    | 'Covenant'
    | 'Amazing key'
    | 'Amazing treasure'
    | 'Amazing chest'
    | 'Amazing weapon'
    | 'Amazing shield'
    | 'Amazing projectile'
    | 'Amazing armour'
    | 'Amazing item'
    | 'Amazing ring'
    | 'Amazing sorcery scroll'
    | 'Amazing pyromancy scroll'
    | 'Amazing miracle scroll'
    | 'Amazing ember'
    | 'Amazing trap'
}

const hashObject = 'object'

export function isObject<V>(v: V) {
  return is$typed(v, id, hashObject)
}

export function validateObject<V>(v: V) {
  return validate<Object & V>(v, id, hashObject)
}

/** Techniques that can be used in conjunction with base phrases to form a complete message */
export interface Technique {
  $type?: 'social.soapstone.text.en.defs#technique'
  selection?:
    | 'Close-ranged battle'
    | 'Ranged battle'
    | 'Eliminating one at a time'
    | 'Luring it out'
    | 'Beating to a pulp'
    | 'Lying in ambush'
    | 'Stealth'
    | 'Mimicry'
    | 'Pincer attack'
    | 'Hitting them in one swoop'
    | 'Fleeing'
    | 'Charging'
    | 'Stabbing in the back'
    | 'Sweeping attack'
    | 'Shield breaking'
    | 'Head shots'
    | 'Sorcery'
    | 'Pyromancy'
    | 'Miracles'
    | 'Jumping off'
    | 'Sliding down'
    | 'Dashing through'
}

const hashTechnique = 'technique'

export function isTechnique<V>(v: V) {
  return is$typed(v, id, hashTechnique)
}

export function validateTechnique<V>(v: V) {
  return validate<Technique & V>(v, id, hashTechnique)
}

/** Action types that can be used in conjunction with base phrases to form a complete message */
export interface Action {
  $type?: 'social.soapstone.text.en.defs#action'
  selection?:
    | 'Rolling'
    | 'Backstepping'
    | 'Jumping'
    | 'Attacking'
    | 'Holding with both hands'
    | 'Kicking'
    | 'A plunging attack'
    | 'Blocking'
    | 'Parrying'
    | 'Locking-on'
}

const hashAction = 'action'

export function isAction<V>(v: V) {
  return is$typed(v, id, hashAction)
}

export function validateAction<V>(v: V) {
  return validate<Action & V>(v, id, hashAction)
}

/** Geography types that can be used in conjunction with base phrases to form a complete message */
export interface Geography {
  $type?: 'social.soapstone.text.en.defs#geography'
  selection?:
    | 'Path'
    | 'Hidden path'
    | 'Shortcut'
    | 'Detour'
    | 'Illusionary wall'
    | 'Shortcut'
    | 'Dead end'
    | 'Swamp'
    | 'Lava'
    | 'Forest'
    | 'Cave'
    | 'Labyrinth'
    | 'Safe zone'
    | 'Danger zone'
    | 'Sniper spot'
    | 'Bright spot'
    | 'Dark spot'
    | 'Open area'
    | 'Tight spot'
    | 'Hidden place'
    | 'Exchange'
    | 'Gorgeous view'
    | 'Fall'
}

const hashGeography = 'geography'

export function isGeography<V>(v: V) {
  return is$typed(v, id, hashGeography)
}

export function validateGeography<V>(v: V) {
  return validate<Geography & V>(v, id, hashGeography)
}

/** Orientation types that can be used in conjunction with base phrases to form a complete message */
export interface Orientation {
  $type?: 'social.soapstone.text.en.defs#orientation'
  selection?:
    | 'Front'
    | 'Back'
    | 'Left'
    | 'Right'
    | 'Up'
    | 'Down'
    | 'Feet'
    | 'Head'
    | 'Back'
}

const hashOrientation = 'orientation'

export function isOrientation<V>(v: V) {
  return is$typed(v, id, hashOrientation)
}

export function validateOrientation<V>(v: V) {
  return validate<Orientation & V>(v, id, hashOrientation)
}

/** Body parts that can be used in conjunction with base phrases to form a complete message */
export interface BodyPart {
  $type?: 'social.soapstone.text.en.defs#bodyPart'
  selection?:
    | 'Head'
    | 'Neck'
    | 'Stomach'
    | 'Back'
    | 'Arm'
    | 'Leg'
    | 'Heel'
    | 'Rear'
    | 'Tail'
    | 'Wings'
    | 'Anywhere'
}

const hashBodyPart = 'bodyPart'

export function isBodyPart<V>(v: V) {
  return is$typed(v, id, hashBodyPart)
}

export function validateBodyPart<V>(v: V) {
  return validate<BodyPart & V>(v, id, hashBodyPart)
}

/** Attributes that can be used in conjunction with base phrases to form a complete message */
export interface Attribute {
  $type?: 'social.soapstone.text.en.defs#attribute'
  selection?:
    | 'Strike'
    | 'Thrust'
    | 'Slash'
    | 'Magic'
    | 'Fire'
    | 'Lightning'
    | 'Critical hits'
    | 'Bleeding'
    | 'Poison'
    | 'Strong poison'
    | 'Curses'
    | 'Divine'
    | 'Occult'
    | 'Crystal'
}

const hashAttribute = 'attribute'

export function isAttribute<V>(v: V) {
  return is$typed(v, id, hashAttribute)
}

export function validateAttribute<V>(v: V) {
  return validate<Attribute & V>(v, id, hashAttribute)
}
