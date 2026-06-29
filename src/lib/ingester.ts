import pino from "pino";
import { IdResolver } from "@atproto/identity";
import { Firehose } from "@atproto/sync";
import type { Event } from "@atproto/sync";
import * as Post from "#/lexicon/types/social/soapstone/feed/post";
import * as Interaction from "#/lexicon/types/social/soapstone/feed/interaction";
import { PostRepository } from "./repositories/post_repo";

const POST_COLLECTION = "social.soapstone.feed.post";
const INTERACTION_COLLECTION = "social.soapstone.feed.interaction";

export function createIngester(
  posts: PostRepository,
  idResolver: IdResolver,
  logger: pino.Logger,
) {
  return new Firehose({
    idResolver,
    handleEvent: async (evt: Event) => {
      // Watch for write events. Posts are immutable so we only ingest them on
      // create; interactions are mutable (re-rating overwrites the record at the
      // same rkey), so we handle their updates too.
      if (evt.event === "create" || evt.event === "update") {
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
        // by `filterCollections`, but we re-check defensively. Posts are
        // immutable, so we ignore post updates.
        if (evt.collection === POST_COLLECTION && evt.event === "create") {
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
        } else if (evt.collection === INTERACTION_COLLECTION) {
          const record = evt.record as Interaction.Record;

          if (
            Interaction.isRecord(record) &&
            Interaction.validateRecord(record).success
          ) {
            logger.debug(
              { time: evt.time, uri: evt.uri, record },
              "ingesting interaction event",
            );

            // Store the interaction in our PostgreSQL database. As with posts, a
            // failure drops the event rather than throwing. A rating of "like"
            // maps to positive=true, "dislike" to false, and an absent rating
            // (a discovery — the account saw the post) to null.
            try {
              await posts.createRating({
                uri: evt.uri.toString(),
                authorDid: evt.did,
                postUri: record.subject.uri,
                messageCid: record.subject.cid,
                positive:
                  record.rating === "like"
                    ? true
                    : record.rating === "dislike"
                      ? false
                      : null,
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
        } else if (evt.collection === INTERACTION_COLLECTION) {
          // Remove the interaction from our PostgreSQL database
          try {
            await posts.deleteRating(evt.uri.toString());
          } catch (error) {
            logger.error(
              { error, uri: evt.uri },
              "failed to delete interaction from database",
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
    filterCollections: [POST_COLLECTION, INTERACTION_COLLECTION],
    excludeIdentity: true,
    excludeAccount: true,
    unauthenticatedHandles: true,
    unauthenticatedCommits: true,
    subscriptionReconnectDelay: 5000, // Wait 5 seconds before reconnecting
  });
}
