import { PostView } from "#/lexicon/types/social/soapstone/feed/defs";
import { Database } from "#/lib/db";
import { parseGeoURI } from "#/lib/geo";
import { Record as PostRecord } from "#/lexicon/types/social/soapstone/feed/post";
import { ProfileViewMinimal } from "#/lexicon/types/social/soapstone/actor/defs";
import { Location } from "#/lexicon/types/social/soapstone/location/defs";
import { Message } from "#/lexicon/types/social/soapstone/message/defs";
import postgis from "knex-postgis";

export interface LexiconController {
  getPostsByLocation(
    latitude: number,
    longitude: number,
    altitude: number | undefined,
    radius: number | undefined,
  ): Promise<PostView[]>;
}

export class SoapStoneLexiconController implements LexiconController {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getPostsByLocation(
    latitude: number,
    longitude: number,
    altitude: number | undefined,
    radius: number | undefined,
  ): Promise<PostView[]> {
    // Implement the logic to fetch posts from the database based on location and radius
    return this.db.select()
  }
}
