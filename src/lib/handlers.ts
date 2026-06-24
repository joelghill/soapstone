import { MethodHandler } from "@atproto/xrpc-server";
import * as GetPosts from "#/lexicon/types/social/soapstone/feed/getPosts";
import { InvalidGeoURIError } from "#/lib/utils/geo";
import { AppContext } from "./server";

export type Session = { did: string };
export type SessionCredentials = { credentials: Session };

export type GetPostsHandler = MethodHandler<
  void,
  GetPosts.QueryParams,
  GetPosts.HandlerInput,
  GetPosts.HandlerOutput
>;

export class SoapStoneLexiconHandler {
  constructor(private ctx: AppContext) {}

  handleGetPosts: GetPostsHandler = async (ctx) => {
    try {
      const response = await this.ctx.posts_repo.getPostsByLocation(
        ctx.params.location,
        ctx.params.radius,
      );
      return {
        encoding: "application/json",
        body: { posts: response },
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
        message:
          err instanceof Error ? err.message : `Internal Server Error: ${err}`,
      };
    }
  };
}
