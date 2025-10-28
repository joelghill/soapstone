/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  type Auth,
  type Options as XrpcOptions,
  Server as XrpcServer,
  type StreamConfigOrHandler,
  type MethodConfigOrHandler,
  createServer as createXrpcServer,
} from '@atproto/xrpc-server'
import { schemas } from './lexicons.js'
import * as SocialSoapstoneFeedGetPosts from './types/social/soapstone/feed/getPosts.js'

export function createServer(options?: XrpcOptions): Server {
  return new Server(options)
}

export class Server {
  xrpc: XrpcServer
  app: AppNS
  com: ComNS
  social: SocialNS

  constructor(options?: XrpcOptions) {
    this.xrpc = createXrpcServer(schemas, options)
    this.app = new AppNS(this)
    this.com = new ComNS(this)
    this.social = new SocialNS(this)
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

  getPosts<A extends Auth = void>(
    cfg: MethodConfigOrHandler<
      A,
      SocialSoapstoneFeedGetPosts.QueryParams,
      SocialSoapstoneFeedGetPosts.HandlerInput,
      SocialSoapstoneFeedGetPosts.HandlerOutput
    >,
  ) {
    const nsid = 'social.soapstone.feed.getPosts' // @ts-ignore
    return this._server.xrpc.method(nsid, cfg)
  }
}
