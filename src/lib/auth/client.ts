import { NodeOAuthClient } from "@atproto/oauth-client-node";
import { env } from "#/lib/env";
import { SessionStore, StateStore } from "#/lib/auth/storage";
import { AuthRepository } from "#/lib/repositories/auth_repo";

export const createClient = async (repo: AuthRepository) => {
  const publicUrl = env.PUBLIC_URL;
  const url = publicUrl || `http://127.0.0.1:${env.PORT}`;
  const enc = encodeURIComponent;
  const callback = `${url}/oauth/callback`;
  const scope = "atproto transition:generic";
  return new NodeOAuthClient({
    clientMetadata: {
      client_name: "Soapstone",
      client_id: publicUrl
        ? `${url}/client-metadata.json`
        : `http://localhost?redirect_uri=${enc(callback)}&scope=${enc(scope)}`,
      client_uri: url,
      redirect_uris: [callback, "social.soapstone:/oauth/callback"],
      scope: scope,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      application_type: "native",
      token_endpoint_auth_method: "none",
      dpop_bound_access_tokens: true,
    },
    stateStore: new StateStore(repo),
    sessionStore: new SessionStore(repo),
  });
};
