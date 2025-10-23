import {
  MethodHandler,
  MethodAuthVerifier,
  Params,
} from "@atproto/xrpc-server";
import { ISoapStoneLexiconController } from "./controllers";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getIronSession } from "iron-session";
import { env } from "#/lib/env";
import pino from "pino";
import * as GetPosts from "#/lexicon/types/social/soapstone/feed/getPosts";
import * as CreatePost from "#/lexicon/types/social/soapstone/feed/createPost";
import { SignedJwt } from "@atproto/oauth-client-node";

export type Session = { did: string };
export type SessionCredentials = { credentials: Session };

export type GetPostsHandler = MethodHandler<
  SessionCredentials,
  GetPosts.QueryParams,
  GetPosts.HandlerInput,
  GetPosts.HandlerOutput
>;

export type CreatePostHandler = MethodHandler<
  SessionCredentials,
  CreatePost.QueryParams,
  CreatePost.HandlerInput,
  CreatePost.HandlerOutput
>;

export class SoapStoneLexiconHandler {
  constructor(
    private controller: ISoapStoneLexiconController,
    private logger: pino.Logger,
  ) {}

  // Helper function to get the active session
  private getSession = async (
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage>,
  ) => {
    try {
      // Get auth data from JWT
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
      }

      const jwt = authHeader.split(" ")[1] as SignedJwt;
      if (!jwt) {
        return null;
      }

      const auth_data = await this.controller.decodeJWT(jwt);
      this.logger.debug({ auth_data }, "Decoded JWT auth data");
      if (!auth_data.sub) return null;
      return { did: auth_data.sub }; // Return an object with the DID from the 'sub' field
    } catch (error) {
      this.logger.error({ error }, "Error getting session");
      return null;
    }
  };

  verifyAuth: MethodAuthVerifier<SessionCredentials, Params> = async (ctx) => {
    const session = await this.getSession(ctx.req, ctx.res);
    if (!session) {
      return { status: 401, message: "Unauthorized" };
    }
    return { credentials: { did: session.did } };
  };

  handleGetPosts: GetPostsHandler = async (ctx) => {
    try {
      const response = await this.controller.getPostsByLocation(
        ctx.params.location,
        ctx.params.radius,
      );
      return {
        encoding: "application/json",
        body: { posts: response },
      } as GetPosts.HandlerSuccess;
    } catch (err) {
      this.logger.error({ err }, "Error fetching posts");
      return {
        status: 500,
        message: err instanceof Error ? err.message : "Internal Server Error",
      };
    }
  };

  handleCreatePost: CreatePostHandler = async (ctx) => {
    const { message, location } = ctx.input.body;
    try {
      const response = await this.controller.createPost(
        ctx.auth.credentials.did,
        message,
        location,
      );
      return {
        encoding: "application/json",
        body: response,
      } as CreatePost.HandlerSuccess;
    } catch (err) {
      this.logger.error({ err }, "Error creating post");
      return {
        status: 500,
        message: err instanceof Error ? err.message : "Internal Server Error",
      };
    }
  };
}
