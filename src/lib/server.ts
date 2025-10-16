import events from "node:events";
import type http from "node:http";
import express, { type Express } from "express";
import pino from "pino";
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
import { createServer, Server as LexServer } from "#/lexicon";
import { type Options as XrpcOptions } from "@atproto/xrpc-server";
import {
  ISoapStoneLexiconController,
  SoapStoneLexiconController,
} from "#/lib/controllers";
import { SoapStoneLexiconHandler } from "#/lib/handlers";
import { AuthRepository } from "#/lib/repositories/auth_repo";
import { PostRepository } from "#/lib/repositories/post_repo";
import { AtProtoRepository } from "#/lib/repositories/atproto_repo";
import path from "path";
import { engine } from "express-handlebars";
import { toBskyLink, formatDate, formatLocation } from "#/pages/home";

// Application state passed to the router and elsewhere
export type AppContext = {
  controller: ISoapStoneLexiconController;
  handler: SoapStoneLexiconHandler;
  ingester: Firehose;
  logger: pino.BaseLogger;
  oauthClient: OAuthClient;
  resolver: BidirectionalResolver;
  posts_repo: PostRepository;
};

export class SoapStoneServer {
  private server?: http.Server;

  constructor(
    public app: express.Application,
    public ctx: AppContext,
  ) {}

  public async start() {
    const { NODE_ENV, HOST, PORT } = env;
    // Subscribe to events on the firehose
    this.ctx.ingester.start();

    // Bind our server to the port
    this.server = this.app.listen(env.PORT);
    await events.once(this.server, "listening");
    this.ctx.logger.info(
      `Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`,
    );
  }

  async close() {
    this.ctx.logger.info("sigint received, shutting down");
    await this.ctx.ingester.destroy();
    return new Promise<void>((resolve) => {
      this.server?.close(() => {
        this.ctx.logger.info("server closed");
        resolve();
      });
    });
  }

  public static async create(ctx: AppContext | null = null) {
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
    if (ctx == null) {
      const baseIdResolver = createIdResolver();
      const resolver = createBidirectionalResolver(baseIdResolver);
      const controller = new SoapStoneLexiconController(
        posts_repo,
        atproto_repo,
      );
      const ingester = createIngester(posts_repo, baseIdResolver);
      const handler = new SoapStoneLexiconHandler(controller, logger);
      ctx = {
        controller,
        handler,
        ingester,
        logger,
        oauthClient,
        resolver,
        posts_repo,
      };
    }

    const xrpcOptions: XrpcOptions = {
      //catchall: ctx.handler.handleCatchall,
    };

    const lexiconServer: LexServer = createServer();
    lexiconServer.social.soapstone.feed.getPosts({
      auth: ctx.handler.verifyAuth,
      handler: ctx.handler.handleGetPosts,
    });
    lexiconServer.social.soapstone.feed.createPost({
      auth: ctx.handler.verifyAuth,
      handler: ctx.handler.handleCreatePost,
    });

    // Create our server
    const app = lexiconServer.xrpc.router;
    app.set("trust proxy", true);

    // // Routes & middlewares
    const router = createRouter(ctx);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(router);
    app.use((_req, res) => {
      res.sendStatus(404);
    });

    // Configure Handlebars as view engine
    app.engine(
      "handlebars",
      engine({
        extname: ".handlebars",
        defaultLayout: "layout",
        layoutsDir: path.join(__dirname, "views"),
        partialsDir: path.join(__dirname, "views/partials"),
        helpers: {
          toBskyLink,
          formatDate,
          formatLocation,
        },
      }),
    );
    app.set("view engine", "handlebars");
    app.set("views", path.join(__dirname, "views"));

    return new SoapStoneServer(app, ctx);
  }
}
