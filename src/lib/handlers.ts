import { MethodHandler } from "@atproto/xrpc-server";
import * as GetPosts from "#/lexicon/types/social/soapstone/feed/getPosts";
import * as GetInteractions from "#/lexicon/types/social/soapstone/feed/getInteractions";
import * as GetAuthorStats from "#/lexicon/types/social/soapstone/feed/getAuthorStats";
import * as GetSimilarActors from "#/lexicon/types/social/soapstone/graph/getSimilarActors";
import { InvalidGeoURIError } from "#/lib/utils/geo";
import { RequiredAuth, OptionalAuth } from "#/lib/auth";
import { AppContext } from "./server";

export type GetPostsHandler = MethodHandler<
  void,
  GetPosts.QueryParams,
  GetPosts.HandlerInput,
  GetPosts.HandlerOutput
>;

export type GetInteractionsHandler = MethodHandler<
  RequiredAuth,
  GetInteractions.QueryParams,
  GetInteractions.HandlerInput,
  GetInteractions.HandlerOutput
>;

export type GetAuthorStatsHandler = MethodHandler<
  OptionalAuth,
  GetAuthorStats.QueryParams,
  GetAuthorStats.HandlerInput,
  GetAuthorStats.HandlerOutput
>;

export type GetSimilarActorsHandler = MethodHandler<
  RequiredAuth,
  GetSimilarActors.QueryParams,
  GetSimilarActors.HandlerInput,
  GetSimilarActors.HandlerOutput
>;

export class SoapStoneLexiconHandler {
  constructor(private ctx: AppContext) {}

  handleGetPosts: GetPostsHandler = async (ctx) => {
    try {
      const { posts, cursor } = await this.ctx.posts_repo.getPostsByLocation(
        ctx.params.location,
        ctx.params.radius,
        ctx.params.limit,
        ctx.params.cursor,
      );
      return {
        encoding: "application/json",
        body: { posts, cursor },
      } as GetPosts.HandlerSuccess;
    } catch (err) {
      // A malformed location is bad client input, not a server fault.
      if (err instanceof InvalidGeoURIError) {
        this.ctx.logger.warn({ err }, "Invalid location in getPosts request");
        return {
          status: 400,
          message: err.message,
        };
      }
      this.ctx.logger.error({ err }, "Error fetching posts");
      return {
        status: 500,
        message: "Internal Server Error",
      };
    }
  };

  handleGetInteractions: GetInteractionsHandler = async (ctx) => {
    try {
      const { interactions, cursor } =
        await this.ctx.interactions_repo.getInteractions(
          ctx.params.uri,
          ctx.auth.credentials.did,
          ctx.params.limit,
          ctx.params.cursor,
        );
      return {
        encoding: "application/json",
        body: { interactions, cursor },
      } as GetInteractions.HandlerSuccess;
    } catch (err) {
      this.ctx.logger.error({ err }, "Error fetching interactions");
      return {
        status: 500,
        message: "Internal Server Error",
      };
    }
  };

  handleGetAuthorStats: GetAuthorStatsHandler = async (ctx) => {
    // `actor` defaults to the authenticated account when omitted.
    const actor = ctx.params.actor ?? ctx.auth.credentials.did;
    if (!actor) {
      return {
        status: 400,
        message: "actor is required when unauthenticated",
      };
    }
    try {
      const stats = await this.ctx.interactions_repo.getAuthorStats(actor);
      return {
        encoding: "application/json",
        body: { stats },
      } as GetAuthorStats.HandlerSuccess;
    } catch (err) {
      this.ctx.logger.error({ err }, "Error fetching author stats");
      return {
        status: 500,
        message: "Internal Server Error",
      };
    }
  };

  handleGetSimilarActors: GetSimilarActorsHandler = async (ctx) => {
    try {
      const { actors, cursor } =
        await this.ctx.interactions_repo.getSimilarActors(
          ctx.auth.credentials.did,
          ctx.params.limit,
          ctx.params.cursor,
        );
      return {
        encoding: "application/json",
        body: { actors, cursor },
      } as GetSimilarActors.HandlerSuccess;
    } catch (err) {
      this.ctx.logger.error({ err }, "Error fetching similar actors");
      return {
        status: 500,
        message: "Internal Server Error",
      };
    }
  };
}
