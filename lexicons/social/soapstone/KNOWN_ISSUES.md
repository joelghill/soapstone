# Lexicon Known Issues

Findings from a review of `lexicons/social/soapstone/` against the atproto
[Lexicon spec](https://atproto.com/specs/lexicon) and
[style guide](https://atproto.com/guides/lexicon-style-guide). Recorded 2026-06-27.

**Update 2026-06-28:** a style-guide conformance pass resolved most items below (lexicon
changes + codegen + backend/tests). Remaining open items are the localization redesign and the
single-member `base` union, intentionally deferred. The phrase `enum`s were kept by decision (the
soapstone vocabulary is an intentionally closed, authored set) and documented in `text/en/defs.json`.

Overall structure is sound: good `.defs` files (no `main`), singular record names,
verb-noun query name, `tid`/`any` keys, real `com.atproto.repo.strongRef`.

## Correctness bugs

- [x] **Duplicate enum values** in `text/en/defs.json` — removed the second `"Shortcut"` (geography)
  and second `"Back"` (orientation).
- [x] **`fill` should not be required** in `message/defs.json` — now `"required": ["base"]`; the
  message util tolerates base-only parts.
- [x] **`selection` is never required** on the text types — added `"required": ["selection"]` to each.

## Style / convention violations

- [x] **snake_case field names** in `feed/defs.json#postView` — reworked to `lowerCamelCase`:
  `author` (profile ref), `likes`/`dislikes`/`discoveries`, `createdAt`. (`viewerState`'s old
  `rating_uri`/`rating_value` were already replaced by `interaction`/`rating`.)
- [x] **Use DID, not at-identifier, for the author** — `postView.author` is now a
  `profileViewMinimal` ref (DID-based), not a bare at-identifier string.
- [x] **`enum` vs `knownValues`** in `text/en/defs.json` — **decision: keep `enum`** (intentionally
  closed authored vocabulary), now documented in the schema descriptions.
- [x] **Missing descriptions** — added to `feed/post.json` record, `feed/defs.json#postView`, and
  `actor/defs.json#profileViewMinimal`.

## Design considerations

- [x] **`postView` inlined a bare `author_did`** — now `author: profileViewMinimal` ref (the backend
  resolves did+handle; displayName/avatar deferred to profile hydration).
- [x] **`location` modeled two ways** — `postView.location` now reuses the `location.defs#location` ref.
- [ ] **Localization is schema-locked to English.** Records persist literal English display strings because
  `message.defs` references `text.en.defs` directly and stores the enum text. A non-English client can't
  re-render existing posts. If multilingual rendering matters, store stable identifiers/tokens and localize on
  display. **Most consequential remaining item — deferred.**
- [x] ~~**`feed.rating`'s `message` field is the rated subject**~~ Resolved: replaced by
  `feed.interaction`, whose subject reference is named `subject`.
- [x] **`getPosts` has no pagination** — added `limit` + `cursor` params and a `cursor` in the output;
  the repo implements keyset pagination on `(created_at, cid)`.
- [ ] **Single-member union for `base`** (`message/defs.json`). A `union` with one ref; a plain `ref`
  is simpler unless more base-phrase variants are planned. Deferred.

## Nits

- [x] Typo "requeter's" → "requester's" in `feed/getPosts.json`.
- [x] `location/defs.json` "3D reference system" phrasing — reworded to RFC 5870 (lat/long + optional altitude).

## Follow-ups not yet wired (separate work)

- [x] **Handlers + route registration** for `getInteractions`, `getAuthorStats`,
  `graph.getSimilarActors` — served via `InteractionRepository` + new handlers, gated by
  inter-service auth (`src/lib/auth.ts`, requires the `SERVICE_DID` env var). The re-rating path
  is now handled too: the ingester processes interaction `update` events and `createRating`
  upserts, backed by a unique `(author_did, post_uri)` index
  (`20260628120000_rating_unique_author_post`).
- Full author profile hydration (`displayName`/`avatar` on `profileViewMinimal`). The
  `resolveProfiles` helper (`src/lib/repositories/profiles.ts`) is the single place to extend.
- Run `yarn migrate` to apply `20260628000000_rating_positive_nullable` and
  `20260628120000_rating_unique_author_post` (couldn't run locally — no DB).
