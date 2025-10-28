import path from "node:path";
import express from "express";
import { home } from "#/pages/home";

// Helper function for defining routes
const handler =
  (fn: express.Handler) =>
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };

const metadata = {
  redirect_uris: ["social.soapstone:/oauth/callback"],
  response_types: ["code"],
  grant_types: ["authorization_code", "refresh_token"],
  scope: "atproto transition:generic",
  token_endpoint_auth_method: "none",
  application_type: "native",
  subject_type: "public",
  authorization_signed_response_alg: "RS256",
  client_id: "https://soapstone.social/client-metadata.json",
  client_name: "Soapstone",
  client_uri: "https://soapstone.social",
  dpop_bound_access_tokens: true,
};

export const createRouter = () => {
  const router = express.Router();

  // Health check endpoint
  router.get(
    "/health",
    handler((_req, res) => {
      res
        .status(200)
        .json({ status: "ok", timestamp: new Date().toISOString() });
    }),
  );

  // Static assets
  router.use("/static", express.static(path.join(__dirname, "static")));

  // OAuth metadata
  router.get(
    "/client-metadata.json",
    handler((_req, res) => {
      // return static OAuth client metadata
      res.json(metadata);
    }),
  );

  // Homepage
  router.get(
    "/",
    handler(async (req, res) => {
      // Serve the logged-in view
      home(res);
    }),
  );
  return router;
};
