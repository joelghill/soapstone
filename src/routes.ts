import assert from "node:assert";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { OAuthResolverError } from "@atproto/oauth-client-node";
import { isValidHandle } from "@atproto/syntax";
import { TID } from "@atproto/common";
import { Agent } from "@atproto/api";
import express from "express";
import { getIronSession } from "iron-session";
import type { AppContext } from "#/lib/server";
import { home } from "#/pages/home";
import { login } from "#/pages/login";
import { env } from "#/lib/env";
import * as Profile from "#/lexicon/types/app/bsky/actor/profile";

type Session = { did: string };

// Helper function for defining routes
const handler =
  (fn: express.Handler) =>
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };

// Helper function to get the Atproto Agent for the active session
async function getSessionAgent(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  ctx: AppContext,
) {
  const session = await getIronSession<Session>(req, res, {
    cookieName: "sid",
    password: env.COOKIE_SECRET,
  });
  if (!session.did) return null;
  try {
    const oauthSession = await ctx.oauthClient.restore(session.did);
    return oauthSession ? new Agent(oauthSession) : null;
  } catch (err) {
    ctx.logger.warn({ err }, "oauth restore failed");
    session.destroy();
    return null;
  }
}

export const createRouter = (ctx: AppContext) => {
  const router = express.Router();

  // Health check endpoint
  router.get(
    "/health",
    handler((_req, res) => {
      res
        .status(200)
        .json({ status: "ok", timestamp: new Date().toISOString() });
    }),
  );

  // Static assets
  router.use("/static", express.static(path.join(__dirname, "static")));

  // OAuth metadata
  router.get(
    "/client-metadata.json",
    handler((_req, res) => {
      res.json(ctx.oauthClient.clientMetadata);
    }),
  );

  // OAuth callback to complete session creation
  router.get(
    "/oauth/callback",
    handler(async (req, res) => {
      const params = new URLSearchParams(req.originalUrl.split("?")[1]);
      try {
        const { session } = await ctx.oauthClient.callback(params);
        const clientSession = await getIronSession<Session>(req, res, {
          cookieName: "sid",
          password: env.COOKIE_SECRET,
        });
        assert(!clientSession.did, "session already exists");
        clientSession.did = session.did;
        await clientSession.save();
      } catch (err) {
        ctx.logger.error({ err }, "oauth callback failed");
        res.redirect("/?error");
        return;
      }
      res.redirect("/");
    }),
  );

  // Login page
  router.get(
    "/login",
    handler(async (_req, res) => {
      login(res, {});
    }),
  );

  // Login handler
  router.post(
    "/login",
    handler(async (req, res) => {
      // Validate
      const handle = req.body?.handle;
      if (typeof handle !== "string" || !isValidHandle(handle)) {
        login(res, { error: "invalid handle" });
        return;
      }

      // Initiate the OAuth flow
      try {
        const url = await ctx.oauthClient.authorize(handle, {
          scope: "atproto transition:generic",
        });
        res.redirect(url.toString());
      } catch (err) {
        ctx.logger.error({ err }, "oauth authorize failed");
        login(res, {
          error:
            err instanceof OAuthResolverError
              ? err.message
              : "couldn't initiate login",
        });
      }
    }),
  );

  // Logout handler
  router.post(
    "/logout",
    handler(async (req, res) => {
      const session = await getIronSession<Session>(req, res, {
        cookieName: "sid",
        password: env.COOKIE_SECRET,
      });
      await session.destroy();
      res.redirect("/");
    }),
  );

  // Homepage
  router.get(
    "/",
    handler(async (req, res) => {
      // If the user is signed in, get an agent which communicates with their server
      const agent = await getSessionAgent(req, res, ctx);

      // Fetch posts from our PostgreSQL database
      const posts = await ctx.posts_repo.getPostsPaginated(50);

      // Map user DIDs to their domain-name handles
      const didHandleMap = await ctx.resolver.resolveDidsToHandles(
        posts.map((p) => p.authorDid),
      );

      if (!agent) {
        // Serve the logged-out view
        home(res, { posts, didHandleMap });
        return;
      }

      // Fetch additional information about the logged-in user
      const profileResponse = await agent.com.atproto.repo
        .getRecord({
          repo: agent.assertDid,
          collection: "app.bsky.actor.profile",
          rkey: "self",
        })
        .catch(() => undefined);

      const profileRecord = profileResponse?.data;

      const profile =
        profileRecord &&
        Profile.isRecord(profileRecord.value) &&
        Profile.validateRecord(profileRecord.value).success
          ? profileRecord.value
          : {};

      // Serve the logged-in view
      home(res, {
        posts,
        didHandleMap,
        profile,
      });
    }),
  );
  return router;
};
