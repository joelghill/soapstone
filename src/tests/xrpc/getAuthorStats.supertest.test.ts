import request from "supertest";
import {
  createMockPostsRepo,
  createMockInteractionsRepo,
  createTestServer,
} from "../utils/test-app";
import { InteractionStats } from "../../lexicon/types/social/soapstone/feed/defs";
import { SoapStoneServer } from "#/lib/server";
import { InteractionRepository } from "#/lib/repositories/interaction_repo";

const AUTHOR = "did:test:author";
const VIEWER = "did:test:viewer";

describe("XRPC getAuthorStats endpoint (supertest)", () => {
  let server: SoapStoneServer;
  let mockInteractionsRepo: jest.Mocked<InteractionRepository>;

  const sampleStats: InteractionStats = {
    likes: 10,
    dislikes: 2,
    discoveries: 20,
  };

  beforeEach(async () => {
    mockInteractionsRepo = createMockInteractionsRepo();
    server = await createTestServer(createMockPostsRepo(), mockInteractionsRepo);
    jest.clearAllMocks();
    mockInteractionsRepo.getAuthorStats.mockResolvedValue(sampleStats);
  });

  it("returns stats for an explicit actor without authentication", async () => {
    const response = await request(server.expressApp)
      .get("/xrpc/social.soapstone.feed.getAuthorStats")
      .query({ actor: AUTHOR })
      .expect(200);

    expect(response.body).toEqual({ stats: sampleStats });
    expect(mockInteractionsRepo.getAuthorStats).toHaveBeenCalledWith(AUTHOR);
  });

  it("defaults to the authenticated account when actor is omitted", async () => {
    const response = await request(server.expressApp)
      .get("/xrpc/social.soapstone.feed.getAuthorStats")
      .set("Authorization", `Bearer ${VIEWER}`)
      .expect(200);

    expect(response.body).toEqual({ stats: sampleStats });
    expect(mockInteractionsRepo.getAuthorStats).toHaveBeenCalledWith(VIEWER);
  });

  it("returns 400 when neither actor nor authentication is provided", async () => {
    await request(server.expressApp)
      .get("/xrpc/social.soapstone.feed.getAuthorStats")
      .expect(400);

    expect(mockInteractionsRepo.getAuthorStats).not.toHaveBeenCalled();
  });

  it("returns 500 when the repository throws", async () => {
    mockInteractionsRepo.getAuthorStats.mockRejectedValue(
      new Error("db failure"),
    );

    await request(server.expressApp)
      .get("/xrpc/social.soapstone.feed.getAuthorStats")
      .query({ actor: AUTHOR })
      .expect(500);
  });
});
