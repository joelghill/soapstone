import request from "supertest";
import {
  createMockPostsRepo,
  createMockInteractionsRepo,
  createTestServer,
} from "../utils/test-app";
import { SharedInteractionsView } from "../../lexicon/types/social/soapstone/graph/defs";
import { SoapStoneServer } from "#/lib/server";
import { InteractionRepository } from "#/lib/repositories/interaction_repo";

const VIEWER = "did:test:viewer";

describe("XRPC getSimilarActors endpoint (supertest)", () => {
  let server: SoapStoneServer;
  let mockInteractionsRepo: jest.Mocked<InteractionRepository>;

  const sampleActors: SharedInteractionsView[] = [
    {
      actor: { did: "did:test:a", handle: "a.test" },
      likesInCommon: 3,
      dislikesInCommon: 1,
      discoveriesInCommon: 5,
    },
  ];

  beforeEach(async () => {
    mockInteractionsRepo = createMockInteractionsRepo();
    server = await createTestServer(createMockPostsRepo(), mockInteractionsRepo);
    jest.clearAllMocks();
    mockInteractionsRepo.getSimilarActors.mockResolvedValue({
      actors: sampleActors,
    });
  });

  it("returns similar actors for an authenticated viewer", async () => {
    const response = await request(server.expressApp)
      .get("/xrpc/social.soapstone.graph.getSimilarActors")
      .set("Authorization", `Bearer ${VIEWER}`)
      .expect(200);

    expect(response.body).toEqual({ actors: sampleActors });
    expect(mockInteractionsRepo.getSimilarActors).toHaveBeenCalledWith(
      VIEWER,
      50,
      undefined,
    );
  });

  it("passes limit and cursor through and returns the next cursor", async () => {
    mockInteractionsRepo.getSimilarActors.mockResolvedValue({
      actors: sampleActors,
      cursor: "next-cursor",
    });

    const response = await request(server.expressApp)
      .get("/xrpc/social.soapstone.graph.getSimilarActors")
      .set("Authorization", `Bearer ${VIEWER}`)
      .query({ limit: "1", cursor: "prev-cursor" })
      .expect(200);

    expect(response.body).toEqual({
      actors: sampleActors,
      cursor: "next-cursor",
    });
    expect(mockInteractionsRepo.getSimilarActors).toHaveBeenCalledWith(
      VIEWER,
      1,
      "prev-cursor",
    );
  });

  it("rejects unauthenticated requests with 401", async () => {
    await request(server.expressApp)
      .get("/xrpc/social.soapstone.graph.getSimilarActors")
      .expect(401);

    expect(mockInteractionsRepo.getSimilarActors).not.toHaveBeenCalled();
  });

  it("returns 500 when the repository throws", async () => {
    mockInteractionsRepo.getSimilarActors.mockRejectedValue(
      new Error("db failure"),
    );

    await request(server.expressApp)
      .get("/xrpc/social.soapstone.graph.getSimilarActors")
      .set("Authorization", `Bearer ${VIEWER}`)
      .expect(500);
  });
});
