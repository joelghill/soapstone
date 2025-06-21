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

export function createServer(options?: XrpcOptions): Server {
  return new Server(options)
}

export class Server {
  xrpc: XrpcServer
  social: SocialNS
  com: ComNS

  constructor(options?: XrpcOptions) {
    this.xrpc = createXrpcServer(schemas, options)
    this.social = new SocialNS(this)
    this.com = new ComNS(this)
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

  constructor(server: Server) {
    this._server = server
    this.feed = new SocialSoapstoneFeedNS(server)
  }
}

export class SocialSoapstoneFeedNS {
  _server: Server

  constructor(server: Server) {
    this._server = server
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
