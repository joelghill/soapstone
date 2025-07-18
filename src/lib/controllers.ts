import {
  PostView,
  CreatePostResponse,
} from "#/lexicon/types/social/soapstone/feed/defs";
import { Database } from "#/lib/db";
import { parseGeoURI } from "#/lib/geo";
import { Record as PostRecord } from "#/lexicon/types/social/soapstone/feed/post";
import { Location } from "#/lexicon/types/social/soapstone/location/defs";
import { Message } from "#/lexicon/types/social/soapstone/message/defs";
import postgis from "knex-postgis";
import { Agent } from "@atproto/api";

export interface LexiconController {
  /**
   * Fetches posts by location within a specified radius.
   * @param latitude - Latitude of the location.
   * @param longitude - Longitude of the location.
   * @param altitude - Altitude of the location (optional).
   * @param radius - Radius in meters to search for posts (optional).
   * @returns A promise that resolves to an array of PostView objects.
   */
  getPostsByLocation(
    latitude: number,
    longitude: number,
    altitude: number | undefined,
    radius: number | undefined,
  ): Promise<PostView[]>;

  /**
   * Creates a new post with the given message and location.
   * @param message - The message content of the post.
   * @param location - The location associated with the post.
   * @returns A promise that resolves to a CreatePostResponse object.
   */
  createPost(
    message: Message,
    location: Location,
    agent: Agent,
  ): Promise<CreatePostResponse>;
}

export class SoapStoneLexiconController implements LexiconController {
  private db: Database;
  private st: postgis.KnexPostgis;

  constructor(db: Database, st: postgis.KnexPostgis) {
    this.db = db;
    this.st = st;
  }

  /**
   * Fetches posts by location within a specified radius.
   * @param latitude - Latitude of the location.
   * @param longitude - Longitude of the location.
   * @param altitude - Altitude of the location (optional).
   * @param radius - Radius in meters to search for posts (optional).
   * @returns A promise that resolves to an array of PostView objects.
   */
  public async getPostsByLocation(
    latitude: number,
    longitude: number,
    altitude: number | undefined,
    radius: number | undefined,
  ): Promise<PostView[]> {
    const searchRadius = radius || 1000; // Default to 1km if not specified
    // Create a point for the search location
    const searchPoint = this.st.geomFromText(
      `POINT(${longitude} ${latitude})`,
      4326,
    );

    // Query posts within the specified radius
    const query = this.db("post")
      .select(
        "post.uri",
        "post.author_did",
        "post.text",
        "post.location",
        "post.created_at",
        "post.indexed_at",
        this.st.asText("post.location").as("location_text"),
      )
      .where(this.st.dwithin("post.location", searchPoint, searchRadius))
      .orderBy("post.created_at", "desc");

    const posts = await query;

    // Get rating counts for all posts
    const postUris = posts.map((p) => p.uri);
    const ratingCounts = await this.db("rating")
      .select("post_uri")
      .whereIn("post_uri", postUris)
      .count("* as total_ratings")
      .select(
        this.db.raw(
          "SUM(CASE WHEN positive = true THEN 1 ELSE 0 END) as positive_count",
        ),
      )
      .select(
        this.db.raw(
          "SUM(CASE WHEN positive = false THEN 1 ELSE 0 END) as negative_count",
        ),
      )
      .groupBy("post_uri");

    // Create a map for quick rating lookup
    const ratingsMap = new Map();
    ratingCounts.forEach((rating) => {
      ratingsMap.set(rating.post_uri, {
        positive: parseInt(rating.positive_count) || 0,
        negative: parseInt(rating.negative_count) || 0,
      });
    });

    // Build PostView objects
    const postViews: PostView[] = posts.map((post) => {
      const ratings = ratingsMap.get(post.uri) || { positive: 0, negative: 0 };
      return {
        uri: post.uri,
        author_uri: post.author_did,
        text: post.text,
        location: post.location_text, // PostGIS location as text
        positiveRatingsCount: ratings.positive,
        negativeRatingsCount: ratings.negative,
        indexedAt: post.indexed_at.toISOString(),
      };
    });

    return postViews;
  }

  /**
   * Creates a new post with the given message and location.
   * @param message - The message content of the post.
   * @param location - The location associated with the post.
   * @returns A promise that resolves to a CreatePostResponse object.
   */
  public async createPost(
    message: Message,
    location: Location,
    agent: Agent,
  ): Promise<CreatePostResponse> {
    // Import TID for generating record key
    const { TID } = await import("@atproto/common");

    // 1. Parse location from geo URI
    const geoData = parseGeoURI(location.uri);

    // 2. Generate message text from Message object parts
    const text = this.createMessageText(message);

    // 3. Create PostRecord
    const record = this.createPostRecord(message, location);

    // 4. Generate record key
    const rkey = TID.nextStr();

    // 5. Write the PostRecord to the user's PDS using agent
    let uri: string;
    let cid: string;
    try {
      const putRes = await agent.com.atproto.repo.putRecord({
        repo: agent.assertDid,
        collection: "social.soapstone.feed.post",
        rkey,
        record,
        validate: false,
      });
      uri = putRes.data.uri;
      cid = putRes.data.cid;
    } catch (err) {
      throw new Error(`Failed to write post record: ${err}`);
    }

    // 6. Insert the post into the database
    try {
      await this.db("post").insert({
        uri,
        author_did: agent.assertDid,
        text,
        location: this.db.raw("ST_GeomFromText(?, 4326)", [
          `POINT(${geoData.longitude} ${geoData.latitude})`,
        ]),
        elevation: geoData.altitude || null,
        created_at: record.createdAt,
        indexed_at: new Date().toISOString(),
      } as any);
    } catch (err) {
      // Log the error but don't fail the request since the record was successfully written to PDS
      console.warn(
        "Failed to update database view; ignoring as it should be caught by the firehose:",
        err,
      );
    }

    return {
      uri,
      cid,
      validationStatus: "valid",
    };
  }

  private createMessageText(message: Message): string {
    const parts: string[] = [];

    // For each part in the message, replace the asterisks in the base phrase with the text in the fill phrase.
    for (const part of message) {
      if (part.base && part.fill) {
        // Extract the actual text values from the typed objects
        const baseText =
          typeof part.base === "string"
            ? part.base
            : (part.base as any).text || part.base;
        const fillText =
          typeof part.fill === "string"
            ? part.fill
            : (part.fill as any).text || part.fill;

        // Replace the asterisks in the base phrase with the fill phrase
        const combinedText = baseText.replace(/\*{4}/g, fillText);
        parts.push(combinedText);
      }
    }

    return parts.join(" ").trim();
  }

  private createPostRecord(message: Message, location: Location): PostRecord {
    return {
      $type: "social.soapstone.feed.post",
      message: message,
      location: location,
      createdAt: new Date().toISOString(),
    };
  }
}
