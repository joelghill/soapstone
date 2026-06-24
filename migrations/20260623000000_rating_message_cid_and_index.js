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
 * Both statements use IF [NOT] EXISTS so the migration is idempotent: the app
 * runs `yarn migrate` on startup, so a retry after an interrupted/concurrent
 * run (e.g. the column or index landed but the migration record did not) must
 * succeed rather than erroring on the already-present object.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(
    'ALTER TABLE "rating" ADD COLUMN IF NOT EXISTS "message_cid" varchar(255)',
  );
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS "rating_post_uri_positive_index" ON "rating" ("post_uri", "positive")',
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw('DROP INDEX IF EXISTS "rating_post_uri_positive_index"');
  await knex.raw('ALTER TABLE "rating" DROP COLUMN IF EXISTS "message_cid"');
};
