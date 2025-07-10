import { CatchallHandler } from "@atproto/xrpc-server";
import { LexiconController } from "./controllers";
import express from "express";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getIronSession } from "iron-session";
import { Agent } from "@atproto/api";
import { env } from "#/lib/env";
import { OAuthClient } from "@atproto/oauth-client-node";
import pino from "pino";
import { Message } from "#/lexicon/types/social/soapstone/message/defs";
import { Location } from "#/lexicon/types/social/soapstone/location/defs";
import { parseGeoURI } from "./geo";

type Session = { did: string };

//Method Ids handled by this class
const METHOD_IDS = [
  "social.soapstone.feed.createPost",
  "social.soapstone.feed.getPosts",
  "social.soapstone.feed.deletePost",
];

export class SoapStoneLexiconHandler {
  constructor(
    private controller: LexiconController,
    private auth: OAuthClient,
    private logger: pino.Logger,
  ) {}

  // Helper function to get the Atproto Agent for the active session
  private getSessionAgent = async (
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage>,
    client: OAuthClient,
  ) => {
    const session = await getIronSession<Session>(req, res, {
      cookieName: "sid",
      password: env.COOKIE_SECRET,
    });
    if (!session.did) return null;
    try {
      const oauthSession = await this.auth.restore(session.did);
      return oauthSession ? new Agent(oauthSession) : null;
    } catch (err) {
      this.logger.warn({ err }, "oauth restore failed");
      session.destroy();
      return null;
    }
  };

  /**
   *
   * @param req
   * @param res
   */
  handleCatchall: CatchallHandler = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const controller: LexiconController = this.controller;
      const method = req.params.methodId as string;

      if (!METHOD_IDS.includes(method)) {
        return next(new Error(`Method ${method} not implemented`));
      } else if (method === "social.soapstone.feed.createPost") {
        const agent = await this.getSessionAgent(req, res, this.auth);
        if (!agent) {
          return res.status(401).send("Unauthorized");
        }
        const { message, location } = req.body as {
          message: Message;
          location: Location;
        };
        const response = await controller.createPost(message, location, agent);
        return res.status(201).json(response);
      } else if (method === "social.soapstone.feed.getPosts") {
        // Parse query parameters to get location and radius
        const { location, radius } = req.query;
        const { latitude, longitude, altitude } = parseGeoURI(
          location as string,
        );
        const response = await controller.getPostsByLocation(
          latitude,
          longitude,
          altitude,
          radius ? parseFloat(radius as string) : undefined,
        );
        return res.status(200).json(response);
      }
    } catch (err) {
      this.logger.error({ err }, "Error handling catchall request");
      return res.status(500).send("Internal Server Error");
    }
  };
}
