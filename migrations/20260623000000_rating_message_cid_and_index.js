/**
 * A rating's `message` field is a strongref (com.atproto.repo.strongRef), which
 * pins the rated post by both URI and CID. The rating table previously stored
 * only the URI, so it could not tell which version of a post was rated. This
 * adds a nullable `message_cid` column to capture the CID component.
 *
 * It also adds a composite `(post_uri, positive)` index so the per-post
 * positive/negative aggregation can run index-only rather than visiting the
 * heap to read the `positive` flag.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return knex.schema.alterTable("rating", (table) => {
    table.string("message_cid");
    table.index(["post_uri", "positive"], "rating_post_uri_positive_index");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return knex.schema.alterTable("rating", (table) => {
    table.dropIndex(["post_uri", "positive"], "rating_post_uri_positive_index");
    table.dropColumn("message_cid");
  });
};
