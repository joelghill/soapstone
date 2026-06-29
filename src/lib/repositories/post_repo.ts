import { Database } from "#/lib/db/postgres";
import { Post } from "./entities";
import postgis from "knex-postgis";
import { IdResolver } from "@atproto/identity";
import { PostView } from "#/lexicon/types/social/soapstone/feed/defs";
import { Message } from "#/lexicon/types/social/soapstone/message/defs";
import { parseGeoURI, convertPostGISToGeoURI } from "#/lib/utils/geo";
import { createMessageText, validateMessageType } from "#/lib/utils/message";
import { resolveProfiles } from "./profiles";
import { encodeCursor, decodeCursor } from "./cursor";

type PostCursor = { createdAt: string; cid: string };

function isPostCursor(v: unknown): v is PostCursor {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as PostCursor).createdAt === "string" &&
    typeof (v as PostCursor).cid === "string"
  );
}

/**
 * Repository for managing post-related database operations.
 */
export class PostRepository {
  private db: Database;
  private st: postgis.KnexPostgis;
  private idResolver: IdResolver;

  constructor(db: Database, st: postgis.KnexPostgis, idResolver: IdResolver) {
    this.db = db;
    this.st = st;
    this.idResolver = idResolver;
  }

  /**
   * Fetches posts by location within a specified radius, newest first.
   * @param geoUri - The geo URI of the location (e.g., "geo:lat,lon").
   * @param radius - Radius in meters to search for posts (default: 1000m).
   * @param limit - Maximum number of posts to return (default: 50).
   * @param cursor - Opaque pagination cursor from a previous call.
   * @returns A promise resolving to a page of PostView objects and the next cursor.
   */
  async getPostsByLocation(
    geoUri: string,
    radius: number = 1000,
    limit: number = 50,
    cursor?: string,
  ): Promise<{ posts: PostView[]; cursor?: string }> {
    // Parse geo URI to get coordinates
    const geoData = parseGeoURI(geoUri);

    // Query posts within the specified radius.
    // The location column is geometry(POINT, 4326), so ST_DWithin would
    // measure distance in degrees (the SRID's units). Cast both geometries to
    // geography so the radius is interpreted in meters.
    const query = this.db("post")
      .select(
        "post.uri",
        "post.cid",
        "post.author_did",
        "post.text",
        "post.location",
        "post.elevation",
        "post.created_at",
        "post.indexed_at",
        this.st.asText("post.location").as("location_text"),
      )
      .whereRaw(
        "ST_DWithin(post.location::geography, ST_GeomFromText(?, 4326)::geography, ?)",
        [`POINT(${geoData.longitude} ${geoData.latitude})`, radius],
      )
      // Rows created before the cid column was added have a null cid. The
      // postView lexicon requires cid, so including them would fail output
      // validation and 500 the whole request. They can't be rated without a
      // cid anyway, so exclude them.
      .whereNotNull("post.cid")
      .orderBy([
        { column: "post.created_at", order: "desc" },
        { column: "post.cid", order: "desc" },
      ])
      .limit(limit);

    // Keyset pagination: continue strictly after the (created_at, cid) tuple
    // encoded in the cursor, matching the descending order above.
    const decoded = decodeCursor(cursor, isPostCursor);
    if (decoded) {
      query.whereRaw("(post.created_at, post.cid) < (?::timestamptz, ?)", [
        decoded.createdAt,
        decoded.cid,
      ]);
    }

    const posts = await query;

    // Aggregate interaction counts for the posts on this page.
    const postUris = posts.map((p) => p.uri);
    const ratingCounts = await this.getRatingCounts(postUris);

    const ratingsMap = new Map<
      string,
      { positive: number; negative: number; total: number }
    >();
    ratingCounts.forEach((rating) => {
      ratingsMap.set(rating.post_uri, {
        positive: parseInt(rating.positive_count) || 0,
        negative: parseInt(rating.negative_count) || 0,
        total: parseInt(rating.total_count) || 0,
      });
    });

    // Resolve author profiles (handles), deduped by DID.
    const authors = await resolveProfiles(
      this.idResolver,
      posts.map((p) => p.author_did),
    );

    // Build PostView objects
    const postViews: PostView[] = posts.map((post) => {
      const ratings = ratingsMap.get(post.uri) || {
        positive: 0,
        negative: 0,
        total: 0,
      };

      // Convert PostGIS POINT text to geo URI format
      const geoUri = convertPostGISToGeoURI(post.location_text, post.elevation);

      return {
        uri: post.uri,
        cid: post.cid,
        author: authors.get(post.author_did) ?? {
          did: post.author_did,
          handle: "handle.invalid",
        },
        text: post.text,
        location: { uri: geoUri },
        likes: ratings.positive,
        dislikes: ratings.negative,
        discoveries: ratings.total,
        createdAt: post.created_at.toISOString(),
      };
    });

    // Only emit a cursor when the page was full; otherwise there is no next page.
    const last = posts[posts.length - 1];
    const nextCursor =
      posts.length === limit && last
        ? encodeCursor({ createdAt: last.created_at.toISOString(), cid: last.cid })
        : undefined;

    return { posts: postViews, cursor: nextCursor };
  }

  /**
   * Creates a new post entry in the database.
   * @param post - The post data to insert.
   * @returns A promise that resolves when the post is created.
   */
  async createPost(post: {
    uri: string;
    cid: string;
    authorDid: string;
    message: Message;
    geoUri: string;
    createdAt: string;
  }): Promise<void> {
    // validate message types
    validateMessageType(post.message);

    // Parse geo URI to get coordinates
    const geoData = parseGeoURI(post.geoUri);

    // Generate text from message
    const text = createMessageText(post.message);

    // Ignore conflicts so replayed firehose events (e.g. after a reconnect)
    // are idempotent rather than raising duplicate-key errors.
    await this.db("post")
      .insert({
        uri: post.uri,
        cid: post.cid,
        author_did: post.authorDid,
        text: text,
        location: this.db.raw("ST_GeomFromText(?, 4326)", [
          `POINT(${geoData.longitude} ${geoData.latitude})`,
        ]),
        elevation: geoData.altitude ?? null,
        created_at: post.createdAt,
        indexed_at: new Date().toISOString(),
      } as any)
      .onConflict("uri")
      .ignore();
  }

  /**
   * Gets rating counts for the specified post URIs.
   * @param postUris - Array of post URIs to get ratings for.
   * @returns A promise that resolves to rating counts.
   */
  private async getRatingCounts(postUris: string[]): Promise<any[]> {
    if (postUris.length === 0) return [];

    return await this.db("rating")
      .select("post_uri")
      .whereIn("post_uri", postUris)
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
      // Discoveries = every interaction row for the post (likes, dislikes, and
      // seen-only records where positive is null).
      .select(this.db.raw("COUNT(*) as total_count"))
      .groupBy("post_uri");
  }

  /**
   * Gets a post by its URI.
   * @param uri - The URI of the post.
   * @returns A promise that resolves to the post or undefined if not found.
   */
  async getPostByUri(uri: string): Promise<Post | undefined> {
    const result: any = await this.db("post")
      .select("*")
      .where("uri", uri)
      .first();

    if (!result) return undefined;

    return {
      uri: result.uri,
      authorDid: result.author_did,
      text: result.text,
      location: result.location,
      elevation: result.elevation,
      createdAt: result.created_at,
      indexedAt: result.indexed_at,
    } as Post;
  }

  /**
   * Creates a new rating for a post.
   * @param rating - The rating data to insert.
   * @returns A promise that resolves when the rating is created.
   */
  async createRating(rating: {
    uri: string;
    authorDid: string;
    postUri: string;
    messageCid?: string;
    // null = a discovery (the account has seen the post but not rated it).
    positive: boolean | null;
    createdAt: string;
  }): Promise<void> {
    // Interactions are mutable: re-rating a post reuses the subject's rkey, so
    // the record (and its uri) is overwritten and the firehose emits an update.
    // Merge on conflict so the stored rating reflects the latest value rather
    // than being ignored. Replayed events converge to the same row, so this
    // stays idempotent.
    //
    // Conflict on (author_did, post_uri) — the appview's one-per-account-per-post
    // constraint — rather than on uri. The interaction lexicon's `key: "any"`
    // lets a non-conformant client write a second interaction for the same post
    // under a different rkey (hence a different uri); targeting the uri PK would
    // miss that conflict and throw on the unique index instead of merging.
    await this.db("rating")
      .insert({
        uri: rating.uri,
        author_did: rating.authorDid,
        post_uri: rating.postUri,
        message_cid: rating.messageCid,
        positive: rating.positive,
        created_at: rating.createdAt,
        indexed_at: new Date().toISOString(),
      } as any)
      .onConflict(["author_did", "post_uri"])
      .merge(["positive", "message_cid", "created_at", "indexed_at"] as any);
  }

  /**
   * Deletes a rating by its URI.
   * @param uri - The URI of the rating to delete.
   * @returns A promise that resolves when the rating is deleted.
   */
  async deleteRating(uri: string): Promise<void> {
    await this.db("rating").where("uri", uri).del();
  }

  /**
   * Deletes a post by its URI.
   * @param uri - The URI of the post to delete.
   * @returns A promise that resolves when the post is deleted.
   */
  async deletePost(uri: string): Promise<void> {
    await this.db("post").where("uri", uri).del();
  }
}
