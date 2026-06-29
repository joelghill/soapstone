/**
 * Keyset pagination cursor helpers shared across repositories.
 *
 * A cursor encodes the sort-key columns of the last row on a page so the next
 * page can continue strictly after it. The payload shape is repository-defined;
 * these helpers only handle the opaque base64url (de)serialization.
 */

/** Encodes an arbitrary cursor payload as an opaque base64url string. */
export function encodeCursor<T extends Record<string, unknown>>(
  payload: T,
): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/**
 * Decodes a base64url cursor and validates it with the provided guard.
 * Returns undefined if the cursor is absent, malformed, or fails the guard.
 */
export function decodeCursor<T>(
  cursor: string | undefined,
  isValid: (value: unknown) => value is T,
): T | undefined {
  if (!cursor) return undefined;
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(cursor, "base64url").toString(),
    );
    if (isValid(parsed)) return parsed;
  } catch {
    // fall through
  }
  return undefined;
}
