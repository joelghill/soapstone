import { IdResolver, getHandle } from "@atproto/identity";
import { ProfileViewMinimal } from "#/lexicon/types/social/soapstone/actor/defs";

/**
 * Resolves a set of account DIDs to minimal profile views. Handles are looked
 * up via the DID document; display name and avatar are left for future profile
 * hydration. Resolution failures fall back to "handle.invalid".
 *
 * Shared by the post and interaction repositories so profile hydration lives in
 * one place.
 *
 * @param idResolver - The atproto identity resolver.
 * @param dids - Account DIDs (may contain duplicates).
 * @returns A map from DID to ProfileViewMinimal.
 */
export async function resolveProfiles(
  idResolver: IdResolver,
  dids: string[],
): Promise<Map<string, ProfileViewMinimal>> {
  const unique = [...new Set(dids)];
  const entries = await Promise.all(
    unique.map(async (did): Promise<[string, ProfileViewMinimal]> => {
      let handle = "handle.invalid";
      try {
        const doc = await idResolver.did.resolve(did);
        if (doc) handle = getHandle(doc) ?? handle;
      } catch {
        // Leave the fallback handle on resolution failure.
      }
      return [did, { did, handle }];
    }),
  );
  return new Map(entries);
}
