/**
 * Adds a `cid` column to the post table. Clients need the record CID alongside
 * the URI to build a strongref (com.atproto.repo.strongRef) when creating
 * ratings. Existing rows predate firehose cid capture, so the column is
 * nullable rather than backfilled.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return knex.schema.alterTable("post", (table) => {
    table.string("cid");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return knex.schema.alterTable("post", (table) => {
    table.dropColumn("cid");
  });
};
