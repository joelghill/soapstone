import events from "node:events";
import type http from "node:http";
import express, { type Express } from "express";
import { pino } from "pino";
import type { OAuthClient } from "@atproto/oauth-client-node";
import { Firehose } from "@atproto/sync";

import { createDb, migrateToLatest } from "#/lib/db/postgres";
import postgis from "knex-postgis";
import { env } from "#/lib/env";
import { createIngester } from "#/lib/ingester";
import { createRouter } from "#/routes";
import { createClient } from "#/lib/auth/client";
import {
  createBidirectionalResolver,
  createIdResolver,
  BidirectionalResolver,
} from "#/lib/id-resolver";
import { createServer, Server as LexServer } from "./lexicon";
import { type Options as XrpcOptions } from "@atproto/xrpc-server";
import {
  ISoapStoneLexiconController,
  SoapStoneLexiconController,
} from "./lib/controllers";
import { SoapStoneLexiconHandler } from "./lib/handlers";
import { AuthRepository } from "./lib/repositories/auth_repo";
import { PostRepository } from "./lib/repositories/post_repo";
import { AtProtoRepository } from "./lib/repositories/atproto_repo";

// Application state passed to the router and elsewhere
export type AppContext = {
  controller: ISoapStoneLexiconController;
  handler: SoapStoneLexiconHandler;
  ingester: Firehose;
  logger: pino.Logger;
  oauthClient: OAuthClient;
  resolver: BidirectionalResolver;
  posts_repo: PostRepository;
};

export class SoapStoneServer {
  constructor(
    public app: express.Application,
    public server: http.Server,
    public ctx: AppContext,
  ) {}

  static async create() {
    const { NODE_ENV, HOST, PORT } = env;
    const logger = pino({ name: "server start" });

    // Set up the PostgreSQL database
    const db = createDb();

    // Attach PostGIS functions
    const st: postgis.KnexPostgis = postgis(db);
    await migrateToLatest(db);

    // Create our repositories
    const authRepo = new AuthRepository(db);
    const oauthClient = await createClient(authRepo);
    const posts_repo = new PostRepository(db, st);
    const atproto_repo = new AtProtoRepository(oauthClient);

    // Create the atproto utilities
    const baseIdResolver = createIdResolver();
    const resolver = createBidirectionalResolver(baseIdResolver);
    const controller = new SoapStoneLexiconController(posts_repo, atproto_repo);
    const ingester = createIngester(posts_repo, baseIdResolver);
    const handler = new SoapStoneLexiconHandler(controller, logger);
    const ctx = {
      controller,
      handler,
      ingester,
      logger,
      oauthClient,
      resolver,
      posts_repo,
    };

    // Subscribe to events on the firehose
    ingester.start();

    const xrpcOptions: XrpcOptions = {
      catchall: ctx.handler.handleCatchall,
    };

    const lexiconServer: LexServer = createServer(xrpcOptions);

    // Create our server
    const app: Express = lexiconServer.xrpc.router;
    app.set("trust proxy", true);

    // // Routes & middlewares
    const router = createRouter(ctx);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(router);
    app.use((_req, res) => {
      res.sendStatus(404);
    });

    // Bind our server to the port
    const server = app.listen(env.PORT);
    await events.once(server, "listening");
    logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);

    return new SoapStoneServer(app, server, ctx);
  }

  async close() {
    this.ctx.logger.info("sigint received, shutting down");
    await this.ctx.ingester.destroy();
    return new Promise<void>((resolve) => {
      this.server.close(() => {
        this.ctx.logger.info("server closed");
        resolve();
      });
    });
  }
}

const run = async () => {
  const server = await SoapStoneServer.create();

  const onCloseSignal = async () => {
    setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
    await server.close();
    process.exit();
  };

  process.on("SIGINT", onCloseSignal);
  process.on("SIGTERM", onCloseSignal);
};

run();
