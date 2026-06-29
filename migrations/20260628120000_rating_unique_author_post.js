/**
 * Enforces one interaction per account per post. The interaction lexicon
 * requires the record key to be the subject post's rkey, so a PDS already keeps
 * a single interaction per (account, post). This adds a matching guarantee at
 * the appview's database with a unique `(author_did, post_uri)` index, so the
 * aggregation queries (getAuthorStats, getInteractions, getSimilarActors) cannot
 * double-count a re-rated post. The index also speeds the viewer-membership
 * lookups those queries run.
 *
 * Uses IF NOT EXISTS so the migration is idempotent: the app runs `yarn migrate`
 * on startup, so a retry after an interrupted/concurrent run must succeed rather
 * than erroring on the already-present index.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(
    'CREATE UNIQUE INDEX IF NOT EXISTS "rating_author_did_post_uri_unique" ON "rating" ("author_did", "post_uri")',
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw('DROP INDEX IF EXISTS "rating_author_did_post_uri_unique"');
};
