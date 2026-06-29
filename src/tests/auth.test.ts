import { IdResolver } from "@atproto/identity";

// Keep everything real (AuthRequiredError, parseReqNsid) except JWT verification,
// so these tests exercise the verifier wiring and real NSID parsing without crypto.
jest.mock("@atproto/xrpc-server", () => {
  const actual = jest.requireActual("@atproto/xrpc-server");
  return {
    ...actual,
    verifyJwt: jest.fn(),
  };
});

import { verifyJwt, AuthRequiredError } from "@atproto/xrpc-server";
import { createAuthVerifiers } from "#/lib/auth";

const mockVerifyJwt = verifyJwt as jest.MockedFunction<typeof verifyJwt>;

const SERVICE_DID = "did:web:appview.test";
const CALLER = "did:test:caller";

// Minimal IdResolver stub; verifyJwt is mocked so the signing-key fn is unused.
const idResolver = {
  did: { resolveAtprotoKey: jest.fn() },
} as unknown as IdResolver;

function ctx(authorization?: string) {
  return {
    req: {
      headers: { authorization },
      url: "/xrpc/social.soapstone.feed.getInteractions",
    },
  } as any;
}

describe("createAuthVerifiers", () => {
  const { required, optional } = createAuthVerifiers(idResolver, SERVICE_DID);

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyJwt.mockResolvedValue({
      iss: CALLER,
      aud: SERVICE_DID,
      exp: 0,
    });
  });

  describe("required", () => {
    it("returns the caller DID from a valid bearer token", async () => {
      const result = await required(ctx(`Bearer good.jwt`));
      expect(result).toEqual({ credentials: { did: CALLER } });
      expect(mockVerifyJwt).toHaveBeenCalledWith(
        "good.jwt",
        SERVICE_DID,
        "social.soapstone.feed.getInteractions",
        expect.any(Function),
      );
    });

    it("throws AuthRequiredError when the header is missing", async () => {
      await expect(required(ctx())).rejects.toBeInstanceOf(AuthRequiredError);
      expect(mockVerifyJwt).not.toHaveBeenCalled();
    });

    it("throws AuthRequiredError for a non-bearer scheme", async () => {
      await expect(required(ctx("Basic abc"))).rejects.toBeInstanceOf(
        AuthRequiredError,
      );
    });

    it("propagates verification failures", async () => {
      mockVerifyJwt.mockRejectedValue(new Error("bad signature"));
      await expect(required(ctx("Bearer bad.jwt"))).rejects.toThrow(
        "bad signature",
      );
    });
  });

  describe("optional", () => {
    it("returns a null DID when unauthenticated", async () => {
      const result = await optional(ctx());
      expect(result).toEqual({ credentials: { did: null } });
      expect(mockVerifyJwt).not.toHaveBeenCalled();
    });

    it("returns the caller DID from a valid bearer token", async () => {
      const result = await optional(ctx("Bearer good.jwt"));
      expect(result).toEqual({ credentials: { did: CALLER } });
    });

    it("rejects an invalid token rather than treating it as anonymous", async () => {
      mockVerifyJwt.mockRejectedValue(new Error("bad signature"));
      await expect(optional(ctx("Bearer bad.jwt"))).rejects.toThrow(
        "bad signature",
      );
    });
  });
});
