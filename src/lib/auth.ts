import {
  AuthRequiredError,
  verifyJwt,
  parseReqNsid,
  type MethodAuthVerifier,
} from "@atproto/xrpc-server";
import { IdResolver } from "@atproto/identity";

/**
 * Credentials attached to a request after inter-service auth.
 *
 * `did` is the DID of the calling account (the JWT issuer). It is non-null for
 * the `required` verifier and may be null for the `optional` verifier when no
 * token was supplied.
 */
export type AuthCredentials = { did: string | null };

/** Auth result for endpoints that require a signed-in caller. */
export type RequiredAuth = { credentials: { did: string } };
/** Auth result for endpoints where authentication is optional. */
export type OptionalAuth = { credentials: AuthCredentials };

export type AuthVerifiers = {
  required: MethodAuthVerifier<RequiredAuth>;
  optional: MethodAuthVerifier<OptionalAuth>;
};

/** Extracts a Bearer token from an Authorization header, if present. */
export function getBearerToken(authorization?: string): string | undefined {
  if (!authorization) return undefined;
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token;
}

/**
 * Builds the inter-service auth verifiers for the appview.
 *
 * Callers' PDSes mint a service-auth JWT (via com.atproto.server.getServiceAuth)
 * scoped to this appview's DID (audience) and the method being called (lxm), and
 * send it as `Authorization: Bearer <jwt>`. We verify the signature against the
 * issuer's atproto signing key (resolved from their DID document) and check the
 * audience and method.
 *
 * @param idResolver - Resolves issuer DIDs to their signing keys.
 * @param serviceDid - This appview's DID; the expected JWT audience.
 */
export function createAuthVerifiers(
  idResolver: IdResolver,
  serviceDid: string,
): AuthVerifiers {
  const getSigningKey = (did: string, forceRefresh: boolean): Promise<string> =>
    idResolver.did.resolveAtprotoKey(did, forceRefresh);

  type Req = Parameters<typeof parseReqNsid>[0];

  const verify = async (req: Req): Promise<string> => {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      throw new AuthRequiredError("Authentication required");
    }
    const nsid = parseReqNsid(req);
    const payload = await verifyJwt(token, serviceDid, nsid, getSigningKey);
    return payload.iss;
  };

  return {
    required: async ({ req }): Promise<RequiredAuth> => {
      const did = await verify(req);
      return { credentials: { did } };
    },
    optional: async ({ req }): Promise<OptionalAuth> => {
      // No token: proceed unauthenticated. A malformed/invalid token still
      // throws, so callers can't pass a bad token and be treated as anonymous.
      if (!getBearerToken(req.headers.authorization)) {
        return { credentials: { did: null } };
      }
      const did = await verify(req);
      return { credentials: { did } };
    },
  };
}
