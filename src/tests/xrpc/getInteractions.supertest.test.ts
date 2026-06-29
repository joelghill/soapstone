import request from "supertest";
import {
  createMockPostsRepo,
  createMockInteractionsRepo,
  createTestServer,
} from "../utils/test-app";
import { InteractionView } from "../../lexicon/types/social/soapstone/feed/defs";
import { SoapStoneServer } from "#/lib/server";
import { InteractionRepository } from "#/lib/repositories/interaction_repo";

const POST_URI = "at://did:test:author/social.soapstone.feed.post/1";
const VIEWER = "did:test:viewer";

describe("XRPC getInteractions endpoint (supertest)", () => {
  let server: SoapStoneServer;
  let mockInteractionsRepo: jest.Mocked<InteractionRepository>;

  const sampleInteractions: InteractionView[] = [
    {
      actor: { did: "did:test:a", handle: "a.test" },
      rating: "like",
      createdAt: "2023-01-02T00:00:00.000Z",
    },
    {
      actor: { did: "did:test:b", handle: "b.test" },
      createdAt: "2023-01-01T00:00:00.000Z",
    },
  ];

  beforeEach(async () => {
    mockInteractionsRepo = createMockInteractionsRepo();
    server = await createTestServer(createMockPostsRepo(), mockInteractionsRepo);
    jest.clearAllMocks();
    mockInteractionsRepo.getInteractions.mockResolvedValue({
      interactions: sampleInteractions,
    });
  });

  it("returns interactions for an authenticated viewer", async () => {
    const response = await request(server.expressApp)
      .get("/xrpc/social.soapstone.feed.getInteractions")
      .set("Authorization", `Bearer ${VIEWER}`)
      .query({ uri: POST_URI })
      .expect(200);

    expect(response.body).toEqual({ interactions: sampleInteractions });
    expect(mockInteractionsRepo.getInteractions).toHaveBeenCalledWith(
      POST_URI,
      VIEWER,
      50,
      undefined,
    );
  });

  it("passes limit and cursor through and returns the next cursor", async () => {
    mockInteractionsRepo.getInteractions.mockResolvedValue({
      interactions: sampleInteractions,
      cursor: "next-cursor",
    });

    const response = await request(server.expressApp)
      .get("/xrpc/social.soapstone.feed.getInteractions")
      .set("Authorization", `Bearer ${VIEWER}`)
      .query({ uri: POST_URI, limit: "1", cursor: "prev-cursor" })
      .expect(200);

    expect(response.body).toEqual({
      interactions: sampleInteractions,
      cursor: "next-cursor",
    });
    expect(mockInteractionsRepo.getInteractions).toHaveBeenCalledWith(
      POST_URI,
      VIEWER,
      1,
      "prev-cursor",
    );
  });

  it("returns an empty list when the viewer has not interacted", async () => {
    mockInteractionsRepo.getInteractions.mockResolvedValue({
      interactions: [],
    });

    const response = await request(server.expressApp)
      .get("/xrpc/social.soapstone.feed.getInteractions")
      .set("Authorization", `Bearer ${VIEWER}`)
      .query({ uri: POST_URI })
      .expect(200);

    expect(response.body).toEqual({ interactions: [] });
  });

  it("rejects unauthenticated requests with 401", async () => {
    await request(server.expressApp)
      .get("/xrpc/social.soapstone.feed.getInteractions")
      .query({ uri: POST_URI })
      .expect(401);

    expect(mockInteractionsRepo.getInteractions).not.toHaveBeenCalled();
  });

  it("rejects requests missing the uri parameter with 400", async () => {
    await request(server.expressApp)
      .get("/xrpc/social.soapstone.feed.getInteractions")
      .set("Authorization", `Bearer ${VIEWER}`)
      .expect(400);

    expect(mockInteractionsRepo.getInteractions).not.toHaveBeenCalled();
  });

  it("returns 500 when the repository throws", async () => {
    mockInteractionsRepo.getInteractions.mockRejectedValue(
      new Error("db failure"),
    );

    await request(server.expressApp)
      .get("/xrpc/social.soapstone.feed.getInteractions")
      .set("Authorization", `Bearer ${VIEWER}`)
      .query({ uri: POST_URI })
      .expect(500);
  });
});
