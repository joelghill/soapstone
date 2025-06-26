import pino from "pino";
import { IdResolver } from "@atproto/identity";
import { Firehose } from "@atproto/sync";
import type { Database } from "#/db";
import * as Status from "#/lexicon/types/xyz/statusphere/status";

export function createIngester(db: Database, idResolver: IdResolver) {
  const logger = pino({ name: "firehose ingestion" });
  return new Firehose({
    idResolver,
    handleEvent: async (evt: any) => {
      // Watch for write events
      if (evt.event === "create" || evt.event === "update") {
        const now = new Date();
        const record = evt.record;

        // If the write is a valid status update
        if (
          evt.collection === "xyz.statusphere.status" &&
          Status.isRecord(record) &&
          Status.validateRecord(record).success
        ) {
          // Store the status in our PostgreSQL database
          await db("status")
            .insert({
              uri: evt.uri.toString(),
              authorDid: evt.did,
              status: record.status,
              createdAt: record.createdAt,
              indexedAt: now.toISOString(),
            })
            .onConflict("uri")
            .merge({
              status: record.status,
              indexedAt: now.toISOString(),
            });
        }
      } else if (
        evt.event === "delete" &&
        evt.collection === "xyz.statusphere.status"
      ) {
        // Remove the status from our PostgreSQL database
        await db("status").where("uri", evt.uri.toString()).del();
      }
    },
    onError: (err: any) => {
      logger.error({ err }, "error on firehose ingestion");
    },
    filterCollections: ["xyz.statusphere.status"],
    excludeIdentity: true,
    excludeAccount: true,
  });
}
