/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  createServer as createXrpcServer,
  Server as XrpcServer,
  type Options as XrpcOptions,
  type AuthVerifier,
  type StreamAuthVerifier,
} from '@atproto/xrpc-server'
import { schemas } from './lexicons.js'
import * as SocialSoapstoneFeedGetPosts from './types/social/soapstone/feed/getPosts.js'
import * as SocialSoapstoneFeedDefsCreatePost from './types/social/soapstone/feed/defs/createPost.js'
import * as SocialSoapstoneFeedDeletePost from './types/social/soapstone/feed/deletePost.js'
import * as SocialSoapstoneFeedCreateRating from './types/social/soapstone/feed/createRating.js'
import * as SocialSoapstoneFeedDeleteRating from './types/social/soapstone/feed/deleteRating.js'
import * as SocialSoapstoneTextGetBasePhrases from './types/social/soapstone/text/getBasePhrases.js'
import * as SocialSoapstoneTextGetFillPhrases from './types/social/soapstone/text/getFillPhrases.js'

export function createServer(options?: XrpcOptions): Server {
  return new Server(options)
}

export class Server {
  xrpc: XrpcServer
  app: AppNS
  com: ComNS
  social: SocialNS
  xyz: XyzNS

  constructor(options?: XrpcOptions) {
    this.xrpc = createXrpcServer(schemas, options)
    this.app = new AppNS(this)
    this.com = new ComNS(this)
    this.social = new SocialNS(this)
    this.xyz = new XyzNS(this)
  }
}

export class AppNS {
  _server: Server
  bsky: AppBskyNS

  constructor(server: Server) {
    this._server = server
    this.bsky = new AppBskyNS(server)
  }
}

export class AppBskyNS {
  _server: Server
  actor: AppBskyActorNS

  constructor(server: Server) {
    this._server = server
    this.actor = new AppBskyActorNS(server)
  }
}

export class AppBskyActorNS {
  _server: Server

  constructor(server: Server) {
    this._server = server
  }
}

export class ComNS {
  _server: Server
  atproto: ComAtprotoNS

  constructor(server: Server) {
    this._server = server
    this.atproto = new ComAtprotoNS(server)
  }
}

export class ComAtprotoNS {
  _server: Server
  repo: ComAtprotoRepoNS

  constructor(server: Server) {
    this._server = server
    this.repo = new ComAtprotoRepoNS(server)
  }
}

export class ComAtprotoRepoNS {
  _server: Server

  constructor(server: Server) {
    this._server = server
  }
}

export class SocialNS {
  _server: Server
  soapstone: SocialSoapstoneNS

  constructor(server: Server) {
    this._server = server
    this.soapstone = new SocialSoapstoneNS(server)
  }
}

export class SocialSoapstoneNS {
  _server: Server
  feed: SocialSoapstoneFeedNS
  text: SocialSoapstoneTextNS

  constructor(server: Server) {
    this._server = server
    this.feed = new SocialSoapstoneFeedNS(server)
    this.text = new SocialSoapstoneTextNS(server)
  }
}

export class SocialSoapstoneFeedNS {
  _server: Server
  defs: SocialSoapstoneFeedDefsNS

  constructor(server: Server) {
    this._server = server
    this.defs = new SocialSoapstoneFeedDefsNS(server)
  }

  getPosts<AV extends AuthVerifier>(
    cfg: ConfigOf<
      AV,
      SocialSoapstoneFeedGetPosts.Handler<ExtractAuth<AV>>,
      SocialSoapstoneFeedGetPosts.HandlerReqCtx<ExtractAuth<AV>>
    >,
  ) {
    const nsid = 'social.soapstone.feed.getPosts' // @ts-ignore
    return this._server.xrpc.method(nsid, cfg)
  }

  deletePost<AV extends AuthVerifier>(
    cfg: ConfigOf<
      AV,
      SocialSoapstoneFeedDeletePost.Handler<ExtractAuth<AV>>,
      SocialSoapstoneFeedDeletePost.HandlerReqCtx<ExtractAuth<AV>>
    >,
  ) {
    const nsid = 'social.soapstone.feed.deletePost' // @ts-ignore
    return this._server.xrpc.method(nsid, cfg)
  }

  createRating<AV extends AuthVerifier>(
    cfg: ConfigOf<
      AV,
      SocialSoapstoneFeedCreateRating.Handler<ExtractAuth<AV>>,
      SocialSoapstoneFeedCreateRating.HandlerReqCtx<ExtractAuth<AV>>
    >,
  ) {
    const nsid = 'social.soapstone.feed.createRating' // @ts-ignore
    return this._server.xrpc.method(nsid, cfg)
  }

  deleteRating<AV extends AuthVerifier>(
    cfg: ConfigOf<
      AV,
      SocialSoapstoneFeedDeleteRating.Handler<ExtractAuth<AV>>,
      SocialSoapstoneFeedDeleteRating.HandlerReqCtx<ExtractAuth<AV>>
    >,
  ) {
    const nsid = 'social.soapstone.feed.deleteRating' // @ts-ignore
    return this._server.xrpc.method(nsid, cfg)
  }
}

export class SocialSoapstoneFeedDefsNS {
  _server: Server

  constructor(server: Server) {
    this._server = server
  }

  createPost<AV extends AuthVerifier>(
    cfg: ConfigOf<
      AV,
      SocialSoapstoneFeedDefsCreatePost.Handler<ExtractAuth<AV>>,
      SocialSoapstoneFeedDefsCreatePost.HandlerReqCtx<ExtractAuth<AV>>
    >,
  ) {
    const nsid = 'social.soapstone.feed.defs.createPost' // @ts-ignore
    return this._server.xrpc.method(nsid, cfg)
  }
}

export class SocialSoapstoneTextNS {
  _server: Server

  constructor(server: Server) {
    this._server = server
  }

  getBasePhrases<AV extends AuthVerifier>(
    cfg: ConfigOf<
      AV,
      SocialSoapstoneTextGetBasePhrases.Handler<ExtractAuth<AV>>,
      SocialSoapstoneTextGetBasePhrases.HandlerReqCtx<ExtractAuth<AV>>
    >,
  ) {
    const nsid = 'social.soapstone.text.getBasePhrases' // @ts-ignore
    return this._server.xrpc.method(nsid, cfg)
  }

  getFillPhrases<AV extends AuthVerifier>(
    cfg: ConfigOf<
      AV,
      SocialSoapstoneTextGetFillPhrases.Handler<ExtractAuth<AV>>,
      SocialSoapstoneTextGetFillPhrases.HandlerReqCtx<ExtractAuth<AV>>
    >,
  ) {
    const nsid = 'social.soapstone.text.getFillPhrases' // @ts-ignore
    return this._server.xrpc.method(nsid, cfg)
  }
}

export class XyzNS {
  _server: Server
  statusphere: XyzStatusphereNS

  constructor(server: Server) {
    this._server = server
    this.statusphere = new XyzStatusphereNS(server)
  }
}

export class XyzStatusphereNS {
  _server: Server

  constructor(server: Server) {
    this._server = server
  }
}

type SharedRateLimitOpts<T> = {
  name: string
  calcKey?: (ctx: T) => string | null
  calcPoints?: (ctx: T) => number
}
type RouteRateLimitOpts<T> = {
  durationMs: number
  points: number
  calcKey?: (ctx: T) => string | null
  calcPoints?: (ctx: T) => number
}
type HandlerOpts = { blobLimit?: number }
type HandlerRateLimitOpts<T> = SharedRateLimitOpts<T> | RouteRateLimitOpts<T>
type ConfigOf<Auth, Handler, ReqCtx> =
  | Handler
  | {
      auth?: Auth
      opts?: HandlerOpts
      rateLimit?: HandlerRateLimitOpts<ReqCtx> | HandlerRateLimitOpts<ReqCtx>[]
      handler: Handler
    }
type ExtractAuth<AV extends AuthVerifier | StreamAuthVerifier> = Extract<
  Awaited<ReturnType<AV>>,
  { credentials: unknown }
>
