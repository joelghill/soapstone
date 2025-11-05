import events from "node:events";
import type http from "node:http";
import express from "express";
import pino from "pino";
import { Firehose } from "@atproto/sync";

import { createDb, migrateToLatest } from "#/lib/db/postgres";
import postgis from "knex-postgis";
import { env } from "#/lib/env";
import { createIngester } from "#/lib/ingester";
import { createRouter } from "#/routes";
import { createIdResolver } from "#/lib/id-resolver";
import { createServer, Server as LexServer } from "#/lexicon";
import { SoapStoneLexiconHandler } from "#/lib/handlers";
import { PostRepository } from "#/lib/repositories/post_repo";
import path from "path";
import { engine } from "express-handlebars";

// Application state passed to the router and elsewhere
export type AppContext = {
  ingester: Firehose;
  logger: pino.BaseLogger;
  posts_repo: PostRepository;
};

export class SoapStoneServer {
  private httpServer?: http.Server;
  private lexServer: LexServer;
  private handler: SoapStoneLexiconHandler;
  public expressApp: express.Application;

  constructor(public ctx: AppContext) {
    //Initialize the Lexicon handler
    this.handler = new SoapStoneLexiconHandler(ctx);

    //Initialize the Express app
    this.lexServer = createServer();
    this.lexServer.social.soapstone.feed.getPosts({
      handler: this.handler.handleGetPosts,
    });

    // Create our server
    this.expressApp = this.lexServer.xrpc.router;
    this.expressApp.set("trust proxy", true);

    //Routes & middlewares
    this.expressApp.use(express.json());
    this.expressApp.use(express.urlencoded({ extended: true }));
    this.expressApp.use(createRouter());
    this.expressApp.use((_req, res) => {
      res.sendStatus(404);
    });

    // Configure Handlebars as view engine
    this.expressApp.engine(
      "handlebars",
      engine({
        extname: ".handlebars",
        defaultLayout: "layout",
        layoutsDir: path.join(__dirname, "../views"),
        partialsDir: path.join(__dirname, "../views/partials"),
        helpers: {},
      }),
    );
    this.expressApp.set("view engine", "handlebars");
    this.expressApp.set("views", path.join(__dirname, "../views"));
  }

  public async start() {
    const { NODE_ENV, HOST, PORT } = env;
    // Subscribe to events on the firehose
    this.ctx.ingester.start();

    // Bind our server to the port
    this.httpServer = this.expressApp.listen(env.PORT);
    await events.once(this.httpServer, "listening");
    this.ctx.logger.info(
      `Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`,
    );
  }

  async close() {
    this.ctx.logger.info("sigint received, shutting down");
    await this.ctx.ingester.destroy();
    return new Promise<void>((resolve) => {
      this.httpServer?.close(() => {
        this.ctx.logger.info("server closed");
        resolve();
      });
    });
  }

  public static async create(ctx: AppContext | null = null) {
    // Create the app context
    if (ctx == null) {
      const logger = pino({ name: "server start", level: env.LOG_LEVEL });
      // Set up the PostgreSQL database
      const db = createDb();

      // Attach PostGIS functions
      const st: postgis.KnexPostgis = postgis(db);
      await migrateToLatest(db);

      // Create our repositories
      const posts_repo = new PostRepository(db, st);
      const baseIdResolver = createIdResolver();
      const ingester = createIngester(
        posts_repo,
        baseIdResolver,
        logger.child({ name: "firehose ingestion" }),
      );
      ctx = {
        ingester,
        logger,
        posts_repo,
      };
    }
    return new SoapStoneServer(ctx);
  }
}
