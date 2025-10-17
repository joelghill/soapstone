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
import * as SocialSoapstoneFeedCreatePost from './types/social/soapstone/feed/createPost.js'
import * as SocialSoapstoneFeedCreateRating from './types/social/soapstone/feed/createRating.js'
import * as SocialSoapstoneFeedDeletePost from './types/social/soapstone/feed/deletePost.js'
import * as SocialSoapstoneFeedDeleteRating from './types/social/soapstone/feed/deleteRating.js'
import * as SocialSoapstoneFeedGetPosts from './types/social/soapstone/feed/getPosts.js'
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
  text: SocialSoapstoneTextNS

  constructor(server: Server) {
    this._server = server
    this.feed = new SocialSoapstoneFeedNS(server)
    this.text = new SocialSoapstoneTextNS(server)
  }
}

export class SocialSoapstoneFeedNS {
  _server: Server

  constructor(server: Server) {
    this._server = server
  }

  createPost<A extends Auth = void>(
    cfg: MethodConfigOrHandler<
      A,
      SocialSoapstoneFeedCreatePost.QueryParams,
      SocialSoapstoneFeedCreatePost.HandlerInput,
      SocialSoapstoneFeedCreatePost.HandlerOutput
    >,
  ) {
    const nsid = 'social.soapstone.feed.createPost' // @ts-ignore
    return this._server.xrpc.method(nsid, cfg)
  }

  createRating<A extends Auth = void>(
    cfg: MethodConfigOrHandler<
      A,
      SocialSoapstoneFeedCreateRating.QueryParams,
      SocialSoapstoneFeedCreateRating.HandlerInput,
      SocialSoapstoneFeedCreateRating.HandlerOutput
    >,
  ) {
    const nsid = 'social.soapstone.feed.createRating' // @ts-ignore
    return this._server.xrpc.method(nsid, cfg)
  }

  deletePost<A extends Auth = void>(
    cfg: MethodConfigOrHandler<
      A,
      SocialSoapstoneFeedDeletePost.QueryParams,
      SocialSoapstoneFeedDeletePost.HandlerInput,
      SocialSoapstoneFeedDeletePost.HandlerOutput
    >,
  ) {
    const nsid = 'social.soapstone.feed.deletePost' // @ts-ignore
    return this._server.xrpc.method(nsid, cfg)
  }

  deleteRating<A extends Auth = void>(
    cfg: MethodConfigOrHandler<
      A,
      SocialSoapstoneFeedDeleteRating.QueryParams,
      SocialSoapstoneFeedDeleteRating.HandlerInput,
      SocialSoapstoneFeedDeleteRating.HandlerOutput
    >,
  ) {
    const nsid = 'social.soapstone.feed.deleteRating' // @ts-ignore
    return this._server.xrpc.method(nsid, cfg)
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

export class SocialSoapstoneTextNS {
  _server: Server

  constructor(server: Server) {
    this._server = server
  }

  getBasePhrases<A extends Auth = void>(
    cfg: MethodConfigOrHandler<
      A,
      SocialSoapstoneTextGetBasePhrases.QueryParams,
      SocialSoapstoneTextGetBasePhrases.HandlerInput,
      SocialSoapstoneTextGetBasePhrases.HandlerOutput
    >,
  ) {
    const nsid = 'social.soapstone.text.getBasePhrases' // @ts-ignore
    return this._server.xrpc.method(nsid, cfg)
  }

  getFillPhrases<A extends Auth = void>(
    cfg: MethodConfigOrHandler<
      A,
      SocialSoapstoneTextGetFillPhrases.QueryParams,
      SocialSoapstoneTextGetFillPhrases.HandlerInput,
      SocialSoapstoneTextGetFillPhrases.HandlerOutput
    >,
  ) {
    const nsid = 'social.soapstone.text.getFillPhrases' // @ts-ignore
    return this._server.xrpc.method(nsid, cfg)
  }
}
