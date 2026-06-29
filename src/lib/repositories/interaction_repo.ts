import { Database } from "#/lib/db/postgres";
import { IdResolver } from "@atproto/identity";
import {
  InteractionView,
  InteractionStats,
} from "#/lexicon/types/social/soapstone/feed/defs";
import { SharedInteractionsView } from "#/lexicon/types/social/soapstone/graph/defs";
import { resolveProfiles } from "./profiles";
import { encodeCursor, decodeCursor } from "./cursor";

type InteractionCursor = { createdAt: string; uri: string };

function isInteractionCursor(v: unknown): v is InteractionCursor {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as InteractionCursor).createdAt === "string" &&
    typeof (v as InteractionCursor).uri === "string"
  );
}

type SimilarActorsCursor = { discoveriesInCommon: number; authorDid: string };

function isSimilarActorsCursor(v: unknown): v is SimilarActorsCursor {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as SimilarActorsCursor).discoveriesInCommon === "number" &&
    typeof (v as SimilarActorsCursor).authorDid === "string"
  );
}

/** Maps a stored `positive` flag to the lexicon rating value, if any. */
function ratingFromPositive(
  positive: boolean | null,
): "like" | "dislike" | undefined {
  if (positive === true) return "like";
  if (positive === false) return "dislike";
  return undefined; // discovery: seen but not rated
}

/**
 * Repository for read-side queries over the interaction (rating) graph: author
 * stats, a post's interactions, and actors with overlapping interactions.
 */
export class InteractionRepository {
  constructor(
    private db: Database,
    private idResolver: IdResolver,
  ) {}

  /**
   * Aggregate interaction counts across all posts authored by an account.
   * @param actor - The author whose posts' interactions to aggregate, as an
   *   at-identifier (handle or DID). Handles are resolved to a DID first, since
   *   `post.author_did` always stores a DID.
   * @returns Like, dislike, and discovery (total) counts.
   */
  async getAuthorStats(actor: string): Promise<InteractionStats> {
    // `actor` may be a handle; the stored author key is always a DID.
    const authorDid = actor.startsWith("did:")
      ? actor
      : await this.idResolver.handle.resolve(actor);
    // An unresolvable handle has no posts (and thus no interactions) here.
    if (!authorDid) {
      return { likes: 0, dislikes: 0, discoveries: 0 };
    }

    const row: any = await this.db("rating")
      .join("post", "rating.post_uri", "post.uri")
      .where("post.author_did", authorDid)
      .select(
        this.db.raw(
          "SUM(CASE WHEN rating.positive = true THEN 1 ELSE 0 END) as likes",
        ),
        this.db.raw(
          "SUM(CASE WHEN rating.positive = false THEN 1 ELSE 0 END) as dislikes",
        ),
        // Discoveries = every interaction row (likes, dislikes, and seen-only).
        this.db.raw("COUNT(*) as discoveries"),
      )
      .first();

    return {
      likes: parseInt(row?.likes) || 0,
      dislikes: parseInt(row?.dislikes) || 0,
      discoveries: parseInt(row?.discoveries) || 0,
    };
  }

  /**
   * Lists other accounts' interactions with a post, newest first. Returns an
   * empty list when the requesting account has not itself interacted with the
   * post (the lexicon gates visibility on reciprocity).
   * @param postUri - AT-URI of the post.
   * @param viewerDid - DID of the requesting account.
   * @param limit - Maximum interactions to return.
   * @param cursor - Opaque keyset cursor from a previous call.
   */
  async getInteractions(
    postUri: string,
    viewerDid: string,
    limit: number = 50,
    cursor?: string,
  ): Promise<{ interactions: InteractionView[]; cursor?: string }> {
    // Gate: only reveal interactions if the viewer has interacted themselves.
    const viewerInteraction = await this.db("rating")
      .where("post_uri", postUri)
      .where("author_did", viewerDid)
      .first();
    if (!viewerInteraction) {
      return { interactions: [] };
    }

    const query = this.db("rating")
      .where("post_uri", postUri)
      .whereNot("author_did", viewerDid)
      .select("uri", "author_did", "positive", "created_at")
      .orderBy([
        { column: "created_at", order: "desc" },
        { column: "uri", order: "desc" },
      ])
      .limit(limit);

    // Keyset pagination: continue strictly after the (created_at, uri) tuple.
    const decoded = decodeCursor(cursor, isInteractionCursor);
    if (decoded) {
      query.whereRaw("(created_at, uri) < (?::timestamptz, ?)", [
        decoded.createdAt,
        decoded.uri,
      ]);
    }

    const rows: any[] = await query;

    const actors = await resolveProfiles(
      this.idResolver,
      rows.map((r) => r.author_did),
    );

    const interactions: InteractionView[] = rows.map((r) => {
      const rating = ratingFromPositive(r.positive);
      return {
        actor: actors.get(r.author_did) ?? {
          did: r.author_did,
          handle: "handle.invalid",
        },
        ...(rating ? { rating } : {}),
        createdAt: r.created_at.toISOString(),
      };
    });

    const last = rows[rows.length - 1];
    const nextCursor =
      rows.length === limit && last
        ? encodeCursor({
            createdAt: last.created_at.toISOString(),
            uri: last.uri,
          })
        : undefined;

    return { interactions, cursor: nextCursor };
  }

  /**
   * Lists accounts whose interactions overlap the viewer's — accounts that have
   * interacted with the same posts — ranked by posts discovered in common.
   * @param viewerDid - DID of the requesting account.
   * @param limit - Maximum accounts to return.
   * @param cursor - Opaque keyset cursor from a previous call.
   */
  async getSimilarActors(
    viewerDid: string,
    limit: number = 50,
    cursor?: string,
  ): Promise<{ actors: SharedInteractionsView[]; cursor?: string }> {
    // The viewer's own interactions, joined against everyone else's on the same
    // posts. FILTER counts how many of those shared posts each account rated the
    // same way as the viewer.
    const viewerRatings = this.db("rating")
      .select("post_uri", "positive")
      .where("author_did", viewerDid)
      .as("v");

    const query = this.db("rating as r")
      .join(viewerRatings, "v.post_uri", "r.post_uri")
      .whereNot("r.author_did", viewerDid)
      .groupBy("r.author_did")
      .select("r.author_did")
      .select(
        this.db.raw(
          "COUNT(*) FILTER (WHERE r.positive = true AND v.positive = true) as likes_in_common",
        ),
        this.db.raw(
          "COUNT(*) FILTER (WHERE r.positive = false AND v.positive = false) as dislikes_in_common",
        ),
        this.db.raw("COUNT(*) as discoveries_in_common"),
      )
      .orderByRaw("discoveries_in_common DESC, r.author_did ASC")
      .limit(limit);

    // Keyset pagination matching the (discoveries DESC, author ASC) ordering.
    // HAVING must repeat the aggregate expression; the alias is not visible here.
    const decoded = decodeCursor(cursor, isSimilarActorsCursor);
    if (decoded) {
      query.havingRaw("COUNT(*) < ? OR (COUNT(*) = ? AND r.author_did > ?)", [
        decoded.discoveriesInCommon,
        decoded.discoveriesInCommon,
        decoded.authorDid,
      ]);
    }

    const rows: any[] = await query;

    const profiles = await resolveProfiles(
      this.idResolver,
      rows.map((r) => r.author_did),
    );

    const actors: SharedInteractionsView[] = rows.map((r) => ({
      actor: profiles.get(r.author_did) ?? {
        did: r.author_did,
        handle: "handle.invalid",
      },
      likesInCommon: parseInt(r.likes_in_common) || 0,
      dislikesInCommon: parseInt(r.dislikes_in_common) || 0,
      discoveriesInCommon: parseInt(r.discoveries_in_common) || 0,
    }));

    const last = rows[rows.length - 1];
    const nextCursor =
      rows.length === limit && last
        ? encodeCursor({
            discoveriesInCommon: parseInt(last.discoveries_in_common) || 0,
            authorDid: last.author_did,
          })
        : undefined;

    return { actors, cursor: nextCursor };
  }
}
