import pino from "pino";
import { IdResolver } from "@atproto/identity";
import { Firehose } from "@atproto/sync";
import * as Post from "#/lexicon/types/social/soapstone/feed/post";
import { PostRepository } from "./repositories/post_repo";

// Errors that should trigger reconnection
const RECONNECTABLE_ERROR_TYPES = [
  "FirehoseSubscriptionError",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
];

function isReconnectableError(err: any): boolean {
  // Check error type
  if (err?.type && RECONNECTABLE_ERROR_TYPES.includes(err.type)) {
    return true;
  }
  // Check error code
  if (err?.code && RECONNECTABLE_ERROR_TYPES.includes(err.code)) {
    return true;
  }
  // Check nested error
  if (err?.cause) {
    return isReconnectableError(err.cause);
  }
  return false;
}

export function createIngester(
  posts: PostRepository,
  idResolver: IdResolver,
  logger: pino.Logger,
) {
  return new Firehose({
    idResolver,
    handleEvent: async (evt: any) => {
      // Watch for write events
      if (evt.event === "create") {
        const now = new Date();
        const record = evt.record as Post.Record;

        // Log when we see any soapstone event
        logger.debug(
          {
            collection: evt.collection,
            uri: evt.uri,
            did: evt.did,
            event: evt.event,
          },
          "soapstone event detected",
        );

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
          try {
            await posts.createPost({
              uri: evt.uri.toString(),
              authorDid: evt.did,
              message: record.message,
              geoUri: record.location.uri,
              createdAt: evt.time,
            });
          } catch (error) {
            logger.error(
              { error, uri: evt.uri, did: evt.did },
              "failed to write post to database",
            );
          }
        }
      } else if (
        evt.event === "delete" &&
        evt.collection === "social.soapstone.feed.post"
      ) {
        logger.debug(
          { collection: evt.collection, uri: evt.uri, event: evt.event },
          "soapstone delete event detected",
        );

        // Remove the post from our PostgreSQL database
        try {
          await posts.deletePost(evt.uri.toString());
        } catch (error) {
          logger.error(
            { error, uri: evt.uri },
            "failed to delete post from database",
          );
        }
      }
    },
    onError: (err: any) => {
      logger.error({ err }, "error on firehose ingestion");
      // Re-throw reconnectable errors to trigger the Firehose's built-in reconnection
      if (isReconnectableError(err)) {
        logger.info("reconnectable error detected, will attempt reconnection");
        throw err;
      }
    },
    filterCollections: ["social.soapstone.feed.post"],
    excludeIdentity: true,
    excludeAccount: true,
    unauthenticatedHandles: true,
    unauthenticatedCommits: true,
    subscriptionReconnectDelay: 5000, // Wait 5 seconds before reconnecting
  });
}
