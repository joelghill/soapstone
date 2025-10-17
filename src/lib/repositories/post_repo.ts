import { Database } from "#/lib/db/postgres";
import { Post } from "./entities";
import postgis from "knex-postgis";
import { PostView } from "#/lexicon/types/social/soapstone/feed/defs";
import { Message } from "#/lexicon/types/social/soapstone/message/defs";
import { parseGeoURI, convertPostGISToGeoURI } from "#/lib/utils/geo";
import { createMessageText, validateMessageType } from "#/lib/utils/message";

/**
 * Repository for managing post-related database operations.
 */
export class PostRepository {
  constructor(
    private db: Database,
    private st: postgis.KnexPostgis,
  ) {}

  /**
   * Fetches posts by location within a specified radius.
   * @param geoUri - The geo URI of the location (e.g., "geo:lat,lon").
   * @param radius - Radius in meters to search for posts (default: 1000m).
   * @returns A promise that resolves to an array of PostView objects.
   */
  async getPostsByLocation(
    geoUri: string,
    radius: number = 1000,
  ): Promise<PostView[]> {
    // Parse geo URI to get coordinates
    const geoData = parseGeoURI(geoUri);

    // Create a point for the search location
    const searchPoint = this.st.geomFromText(
      `POINT(${geoData.longitude} ${geoData.latitude})`,
      4326,
    );

    // Query posts within the specified radius
    const query = this.db("post")
      .select(
        "post.uri",
        "post.author_did",
        "post.text",
        "post.location",
        "post.elevation",
        "post.created_at",
        "post.indexed_at",
        this.st.asText("post.location").as("location_text"),
      )
      .where(this.st.dwithin("post.location", searchPoint, radius))
      .orderBy("post.created_at", "desc");

    const posts = await query;

    // Get rating counts for all posts
    const postUris = posts.map((p) => p.uri);
    const ratingCounts = await this.getRatingCounts(postUris);

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

      // Convert PostGIS POINT text to geo URI format
      const geoUri = convertPostGISToGeoURI(post.location_text, post.elevation);

      return {
        uri: post.uri,
        author_uri: post.author_did,
        text: post.text,
        location: geoUri, // Geo URI format
        positiveRatingsCount: ratings.positive,
        negativeRatingsCount: ratings.negative,
        indexedAt: post.indexed_at.toISOString(),
      };
    });

    return postViews;
  }

  /**
   * Creates a new post entry in the database.
   * @param post - The post data to insert.
   * @returns A promise that resolves when the post is created.
   */
  async createPost(post: {
    uri: string;
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

    await this.db("post").insert({
      uri: post.uri,
      author_did: post.authorDid,
      text: text,
      location: this.db.raw("ST_GeomFromText(?, 4326)", [
        `POINT(${geoData.longitude} ${geoData.latitude})`,
      ]),
      elevation: geoData.altitude || null,
      created_at: post.createdAt,
      indexed_at: new Date().toISOString(),
    } as any);
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
    positive: boolean;
    createdAt: string;
  }): Promise<void> {
    await this.db("rating").insert({
      uri: rating.uri,
      author_did: rating.authorDid,
      post_uri: rating.postUri,
      positive: rating.positive,
      created_at: rating.createdAt,
      indexed_at: new Date().toISOString(),
    } as any);
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

  /**
   * Gets posts in descending order of creation date with pagination.
   * @param limit - Maximum number of posts to return (default: 20).
   * @param offset - Number of posts to skip (default: 0).
   * @returns A promise that resolves to an array of PostView objects.
   */
  async getPostsPaginated(
    limit: number = 20,
    offset: number = 0,
  ): Promise<PostView[]> {
    // Query posts with pagination and ordering
    const query = this.db("post")
      .select(
        "post.uri",
        "post.author_did",
        "post.text",
        "post.location",
        "post.elevation",
        "post.created_at",
        "post.indexed_at",
        this.st.asText("post.location").as("location_text"),
      )
      .orderBy("post.created_at", "desc")
      .limit(limit)
      .offset(offset);

    const posts = await query;

    // Get rating counts for all posts
    const postUris = posts.map((p) => p.uri);
    const ratingCounts = await this.getRatingCounts(postUris);

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

      // Convert PostGIS POINT text to geo URI format
      const geoUri = convertPostGISToGeoURI(post.location_text, post.elevation);

      return {
        uri: post.uri,
        author_uri: post.author_did,
        text: post.text,
        location: geoUri, // Geo URI format
        positiveRatingsCount: ratings.positive,
        negativeRatingsCount: ratings.negative,
        indexedAt: post.indexed_at.toISOString(),
      };
    });

    return postViews;
  }
}
