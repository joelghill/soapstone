import type { PostView } from "#/lexicon/types/social/soapstone/feed/defs";
import type { Response } from "express";
import * as TextEn from "#/lexicon/types/social/soapstone/text/en/defs";

type Props = {
  posts: PostView[];
  didHandleMap: Record<string, string>;
  profile?: { displayName?: string };
  lexicon?: {
    basePhrases: string[];
    characters: string[];
    objects: string[];
    techniques: string[];
    actions: string[];
    geography: string[];
    orientation: string[];
    bodyParts: string[];
    attributes: string[];
  };
  lexiconJson?: string;
};

// Lexicon data arrays - these match the types exactly
const LEXICON_DATA = {
  basePhrases: [
    "**** ahead",
    "Be wary of ****",
    "Try ****",
    "Need ****",
    "Imminent ****...",
    "Weakness:****",
    "****",
    "****?",
    "Good Luck",
    "I did it!",
    "Here!",
    "I can't take this...",
    "Praise the Sun!",
  ],

  characters: [
    "Enemy",
    "Tough enemy",
    "Hollow",
    "Soldier",
    "Knight",
    "Sniper",
    "Caster",
    "Giant",
    "Skeleton",
    "Ghost",
    "Bug",
    "Poison bug",
    "Lizard",
    "Drake",
    "Flier",
    "Golem",
    "Statue",
    "Monster",
    "Strange creature",
    "Demon",
    "Darkwraith",
    "Dragon",
    "Boss",
  ],

  objects: [
    "Bonfire",
    "Fog wall",
    "Humanity",
    "Lever",
    "Switch",
    "Key",
    "Treasure",
    "Chest",
    "Weapon",
    "Shield",
    "Projectile",
    "Armour",
    "Item",
    "Ring",
    "Sorcery scroll",
    "Pyromancy scroll",
    "Miracle scroll",
    "Ember",
    "Trap",
    "Covenant",
    "Amazing key",
    "Amazing treasure",
    "Amazing chest",
    "Amazing weapon",
    "Amazing shield",
    "Amazing projectile",
    "Amazing armour",
    "Amazing item",
    "Amazing ring",
    "Amazing sorcery scroll",
    "Amazing pyromancy scroll",
    "Amazing miracle scroll",
    "Amazing ember",
    "Amazing trap",
  ],

  techniques: [
    "Close-ranged battle",
    "Ranged battle",
    "Eliminating one at a time",
    "Luring it out",
    "Beating to a pulp",
    "Lying in ambush",
    "Stealth",
    "Mimicry",
    "Pincer attack",
    "Hitting them in one swoop",
    "Fleeing",
    "Charging",
    "Stabbing in the back",
    "Sweeping attack",
    "Shield breaking",
    "Head shots",
    "Sorcery",
    "Pyromancy",
    "Miracles",
    "Jumping off",
    "Sliding down",
    "Dashing through",
  ],

  actions: [
    "Rolling",
    "Backstepping",
    "Jumping",
    "Attacking",
    "Holding with both hands",
    "Kicking",
    "A plunging attack",
    "Blocking",
    "Parrying",
    "Locking-on",
  ],

  geography: [
    "Path",
    "Hidden path",
    "Shortcut",
    "Detour",
    "Illusionary wall",
    "Shortcut",
    "Dead end",
    "Swamp",
    "Lava",
    "Forest",
    "Cave",
    "Labyrinth",
    "Safe zone",
    "Danger zone",
    "Sniper spot",
    "Bright spot",
    "Dark spot",
    "Open area",
    "Tight spot",
    "Hidden place",
    "Exchange",
    "Gorgeous view",
    "Fall",
  ],

  orientation: [
    "Front",
    "Back",
    "Left",
    "Right",
    "Up",
    "Down",
    "Feet",
    "Head",
    "Back",
  ],

  bodyParts: [
    "Head",
    "Neck",
    "Stomach",
    "Back",
    "Arm",
    "Leg",
    "Heel",
    "Rear",
    "Tail",
    "Wings",
    "Anywhere",
  ],

  attributes: [
    "Strike",
    "Thrust",
    "Slash",
    "Magic",
    "Fire",
    "Lightning",
    "Critical hits",
    "Bleeding",
    "Poison",
    "Strong poison",
    "Curses",
    "Divine",
    "Occult",
    "Crystal",
  ],
};

export function home(res: Response, props: Props): void {
  const renderProps = { ...props };

  // Add lexicon data if user is logged in (has profile)
  if (props.profile) {
    renderProps.lexicon = LEXICON_DATA;
    renderProps.lexiconJson = JSON.stringify(LEXICON_DATA);
  }

  res.render("home", {
    title: "Home",
    layout: "layout",
    ...renderProps,
  });
}

export function toBskyLink(handle: string) {
  return `https://bsky.app/profile/${handle}`;
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export function formatLocation(location: any) {
  if (location && location.coordinates) {
    const [longitude, latitude] = location.coordinates;
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
  return "Unknown location";
}
