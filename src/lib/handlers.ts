import { CatchallHandler } from "@atproto/xrpc-server";
import { ISoapStoneLexiconController } from "./controllers";
import express from "express";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getIronSession } from "iron-session";
import { env } from "#/lib/env";
import { OAuthClient } from "@atproto/oauth-client-node";
import pino from "pino";
import { Message } from "#/lexicon/types/social/soapstone/message/defs";
import { Location } from "#/lexicon/types/social/soapstone/location/defs";
import { AuthError } from "#/lib/errors";

type Session = { did: string };

//Method Ids handled by this class
const METHOD_IDS = [
  "social.soapstone.feed.createPost",
  "social.soapstone.feed.getPosts",
  "social.soapstone.feed.deletePost",
];

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
    const session = await getIronSession<Session>(req, res, {
      cookieName: "sid",
      password: env.COOKIE_SECRET,
    });
    if (!session.did) return null;
    return session;
  };

  /**
   * Handles all catchall requests for the SoapStone service.
   * @param req
   * @param res
   */
  handleCatchall: CatchallHandler = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const controller: ISoapStoneLexiconController = this.controller;
      const method = req.params.methodId as string;

      if (!METHOD_IDS.includes(method)) {
        return next(new Error(`Method ${method} not implemented`));
      } else if (method === "social.soapstone.feed.createPost") {
        const session = await this.getSession(req, res);
        if (!session) {
          return res.status(401).send("Unauthorized");
        }
        const { message, location } = req.body as {
          message: Message;
          location: Location;
        };
        const response = await controller.createPost(
          session.did,
          message,
          location,
        );
        return res.status(201).json(response);
      } else if (method === "social.soapstone.feed.getPosts") {
        // Parse query parameters to get location and radius
        const { location, radius } = req.query;
        const response = await controller.getPostsByLocation(
          location as string,
          radius ? parseFloat(radius as string) : undefined,
        );
        return res.status(200).json({ posts: response });
      }
    } catch (err: unknown) {
      this.logger.error({ err }, "Error handling catchall request");
      if (err instanceof AuthError) {
        return res.status(401).send("Unauthorized");
      }
      return res.status(500).send("Internal Server Error");
    }
  };
}
