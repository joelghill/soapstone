import pino from "pino";
import { IdResolver } from "@atproto/identity";
import { Firehose } from "@atproto/sync";
import type { Event } from "@atproto/sync";
import * as Post from "#/lexicon/types/social/soapstone/feed/post";
import * as Rating from "#/lexicon/types/social/soapstone/feed/rating";
import { PostRepository } from "./repositories/post_repo";

const POST_COLLECTION = "social.soapstone.feed.post";
const RATING_COLLECTION = "social.soapstone.feed.rating";

export function createIngester(
  posts: PostRepository,
  idResolver: IdResolver,
  logger: pino.Logger,
) {
  return new Firehose({
    idResolver,
    handleEvent: async (evt: Event) => {
      // Watch for write events. Soapstone posts are immutable, so we only
      // handle create/delete and ignore update events.
      if (evt.event === "create") {
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

        // If the write is a valid post. The collection is already restricted
        // by `filterCollections`, but we re-check defensively.
        if (evt.collection === POST_COLLECTION) {
          const record = evt.record as Post.Record;

          if (Post.isRecord(record) && Post.validateRecord(record).success) {
            logger.debug(
              { time: evt.time, uri: evt.uri, record },
              "ingesting post event",
            );

            // Store the post in our PostgreSQL database. A failure here drops
            // this event (the firehose cursor still advances), so we log rather
            // than throw — throwing from handleEvent does not trigger redelivery.
            try {
              await posts.createPost({
                uri: evt.uri.toString(),
                cid: evt.cid.toString(),
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
        } else if (evt.collection === RATING_COLLECTION) {
          const record = evt.record as Rating.Record;

          if (
            Rating.isRecord(record) &&
            Rating.validateRecord(record).success
          ) {
            logger.debug(
              { time: evt.time, uri: evt.uri, record },
              "ingesting rating event",
            );

            // Store the rating in our PostgreSQL database. As with posts, a
            // failure drops the event rather than throwing.
            try {
              await posts.createRating({
                uri: evt.uri.toString(),
                authorDid: evt.did,
                postUri: record.message.uri,
                messageCid: record.message.cid,
                positive: record.value,
                createdAt: evt.time,
              });
            } catch (error) {
              logger.error(
                { error, uri: evt.uri, did: evt.did },
                "failed to write rating to database",
              );
            }
          }
        }
      } else if (evt.event === "delete") {
        logger.debug(
          { collection: evt.collection, uri: evt.uri, event: evt.event },
          "soapstone delete event detected",
        );

        if (evt.collection === POST_COLLECTION) {
          // Remove the post from our PostgreSQL database
          try {
            await posts.deletePost(evt.uri.toString());
          } catch (error) {
            logger.error(
              { error, uri: evt.uri },
              "failed to delete post from database",
            );
          }
        } else if (evt.collection === RATING_COLLECTION) {
          // Remove the rating from our PostgreSQL database
          try {
            await posts.deleteRating(evt.uri.toString());
          } catch (error) {
            logger.error(
              { error, uri: evt.uri },
              "failed to delete rating from database",
            );
          }
        }
      }
    },
    // Log only. The Firehose reconnects on subscription errors on its own
    // (after `subscriptionReconnectDelay`); throwing from here would skip that
    // built-in reconnect and surface as an unhandled rejection.
    onError: (err: Error) => {
      logger.error({ err }, "error on firehose ingestion");
    },
    filterCollections: [POST_COLLECTION, RATING_COLLECTION],
    excludeIdentity: true,
    excludeAccount: true,
    unauthenticatedHandles: true,
    unauthenticatedCommits: true,
    subscriptionReconnectDelay: 5000, // Wait 5 seconds before reconnecting
  });
}
