import events from "node:events";
import type http from "node:http";
import express, { type Express } from "express";
import { pino } from "pino";
import type { OAuthClient } from "@atproto/oauth-client-node";
import { Firehose } from "@atproto/sync";

import { createDb, migrateToLatest } from "#/lib/db";
import postgis from "knex-postgis";
import { env } from "#/lib/env";
import { createIngester } from "#/ingester";
import { createRouter } from "#/routes";
import { createClient } from "#/auth/client";
import {
  createBidirectionalResolver,
  createIdResolver,
  BidirectionalResolver,
} from "#/lib/id-resolver";
import type { Database } from "#/lib/db";
import { createServer, Server as LexServer } from "../lexicon";
import { SoapStoneLexiconController } from "./controllers";
import { SoapStoneLexiconHandler } from "./handlers";

// Application state passed to the router and elsewhere
export type AppContext = {
  db: Database;
  handler: SoapStoneLexiconHandler;
  ingester: Firehose;
  logger: pino.Logger;
  oauthClient: OAuthClient;
  resolver: BidirectionalResolver;
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

    // Create the atproto utilities
    const oauthClient = await createClient(db);
    const baseIdResolver = createIdResolver();
    const ingester = createIngester(db, baseIdResolver);
    const resolver = createBidirectionalResolver(baseIdResolver);
    const controller = new SoapStoneLexiconController(db, st);
    const handler = new SoapStoneLexiconHandler(
      controller,
      oauthClient,
      logger,
    );
    const ctx = {
      db,
      handler,
      ingester,
      logger,
      oauthClient,
      resolver,
    } as AppContext;

    // Subscribe to events on the firehose
    ingester.start();

    const lexiconServer: LexServer = createServer();

    // Create our server
    const app: Express = lexiconServer.xrpc.router;
    // app.set("trust proxy", true);

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
