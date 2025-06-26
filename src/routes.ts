import assert from "node:assert";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { OAuthResolverError } from "@atproto/oauth-client-node";
import { isValidHandle } from "@atproto/syntax";
import { TID } from "@atproto/common";
import { Agent } from "@atproto/api";
import express from "express";
import { getIronSession } from "iron-session";
import type { AppContext } from "#/index";
import { home } from "#/pages/home";
import { login } from "#/pages/login";
import { env } from "#/lib/env";
import { page } from "#/lib/view";
import * as Status from "#/lexicon/types/xyz/statusphere/status";
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
  router.use(
    "/public",
    express.static(path.join(__dirname, "pages", "public")),
  );

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
      res.type("html").send(page(login({})));
    }),
  );

  // Login handler
  router.post(
    "/login",
    handler(async (req, res) => {
      // Validate
      const handle = req.body?.handle;
      if (typeof handle !== "string" || !isValidHandle(handle)) {
        res.type("html").send(page(login({ error: "invalid handle" })));
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
        res.type("html").send(
          page(
            login({
              error:
                err instanceof OAuthResolverError
                  ? err.message
                  : "couldn't initiate login",
            }),
          ),
        );
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

      // Fetch data stored in our PostgreSQL database
      const statuses = await ctx
        .db("status")
        .select("*")
        .orderBy("indexedAt", "desc")
        .limit(10);
      const myStatus = agent
        ? await ctx
            .db("status")
            .select("*")
            .where("authorDid", agent.assertDid)
            .orderBy("indexedAt", "desc")
            .first()
        : undefined;

      // Map user DIDs to their domain-name handles
      const didHandleMap = await ctx.resolver.resolveDidsToHandles(
        statuses.map((s) => s.authorDid),
      );

      if (!agent) {
        // Serve the logged-out view
        res.type("html").send(page(home({ statuses, didHandleMap })));
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
      res.type("html").send(
        page(
          home({
            statuses,
            didHandleMap,
            profile,
            myStatus,
          }),
        ),
      );
    }),
  );

  // "Set status" handler
  router.post(
    "/status",
    handler(async (req, res) => {
      // If the user is signed in, get an agent which communicates with their server
      const agent = await getSessionAgent(req, res, ctx);
      if (!agent) {
        res.status(401).type("html").send("<h1>Error: Session required</h1>");
        return;
      }

      // Construct & validate their status record
      const rkey = TID.nextStr();
      const record = {
        $type: "xyz.statusphere.status",
        status: req.body?.status,
        createdAt: new Date().toISOString(),
      };
      if (!Status.validateRecord(record).success) {
        res.status(400).type("html").send("<h1>Error: Invalid status</h1>");
        return;
      }

      let uri;
      try {
        // Write the status record to the user's repository
        const putRes = await agent.com.atproto.repo.putRecord({
          repo: agent.assertDid,
          collection: "xyz.statusphere.status",
          rkey,
          record,
          validate: false,
        });
        uri = putRes.data.uri;
      } catch (err) {
        ctx.logger.warn({ err }, "failed to write record");
        res
          .status(500)
          .type("html")
          .send("<h1>Error: Failed to write record</h1>");
        return;
      }

      try {
        // Optimistically update our PostgreSQL database
        // This isn't strictly necessary because the write event will be
        // handled in #/firehose/ingestor.ts, but it ensures that future reads
        // will be up-to-date after this method finishes.
        await ctx.db("status").insert({
          uri,
          authorDid: agent.assertDid,
          status: record.status,
          createdAt: record.createdAt,
          indexedAt: new Date().toISOString(),
        });
      } catch (err) {
        ctx.logger.warn(
          { err },
          "failed to update computed view; ignoring as it should be caught by the firehose",
        );
      }

      res.redirect("/");
    }),
  );

  return router;
};
