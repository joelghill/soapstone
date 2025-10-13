import pino from "pino";
import { IdResolver } from "@atproto/identity";
import { Firehose } from "@atproto/sync";
import * as Post from "#/lexicon/types/social/soapstone/feed/post";
import { PostRepository } from "./repositories/post_repo";

export function createIngester(posts: PostRepository, idResolver: IdResolver) {
  const logger = pino({ name: "firehose ingestion" });
  return new Firehose({
    idResolver,
    handleEvent: async (evt: any) => {
      // Watch for write events
      if (evt.event === "create") {
        const now = new Date();
        const record = evt.record as Post.Record;
        // If the write is a valid post update
        if (
          evt.collection === "social.soapstone.feed.post" &&
          Post.isRecord(record) &&
          Post.validateRecord(record).success
        ) {
          logger.debug(
            { time: now.toISOString(), uri: evt.uri, record },
            "ingesting event",
          );
          // Store the post in our PostgreSQL database
          await posts.createPost({
            uri: evt.uri.toString(),
            authorDid: evt.did,
            message: record.message,
            geoUri: record.location.uri,
            createdAt: evt.time,
          });
        }
      } else if (
        evt.event === "delete" &&
        evt.collection === "social.soapstone.feed.post"
      ) {
        // Remove the post from our PostgreSQL database
        await posts.deletePost(evt.uri.toString());
      }
    },
    onError: (err: any) => {
      logger.error({ err }, "error on firehose ingestion");
    },
    // filterCollections: ["xyz.statusphere.status"],
    excludeIdentity: true,
    excludeAccount: true,
  });
}
