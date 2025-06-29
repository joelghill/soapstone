// File containing controller classes for handling various operations
import {
  type HandlerOutput as IGetPostsHandlerOutput,
  HandlerReqCtx as GetPostsCtx,
} from "#/lexicon/types/social/soapstone/feed/getPosts";
import { HandlerAuth } from "@atproto/xrpc-server";
import { parseGeoURI } from "#/lib/geo";
import { Database } from "#/lib/db";
import { LexiconController } from "./controllers";

export class SoapStoneLexiconHandler {
  controller: LexiconController;

  constructor(controller: LexiconController) {
    this.controller = controller;
  }

  async handleGetPosts(
    ctx: GetPostsCtx<HandlerAuth>,
  ): Promise<IGetPostsHandlerOutput> {
    const { auth, params, req, res } = ctx;
    const { location, radius } = params;

    // Parse Geo URI location
    try {
      const { latitude, longitude, altitude } = parseGeoURI(location);

      // Validate radius if provided
      if (radius && (typeof radius !== "number" || radius <= 0)) {
        return {
          status: 400,
          message: "Invalid radius. Must be a positive number.",
        };
      }

      // Fetch posts from the database based on the location and radius
      const posts = await this.controller.getPostsByLocation(
        latitude,
        longitude,
        altitude,
        radius,
      );

      return {
        encoding: "application/json",
        body: { posts },
      };
    } catch (error) {
      return {
        status: 400,
        message: "Invalid Geo URI format.",
      };
    }
  }
}
