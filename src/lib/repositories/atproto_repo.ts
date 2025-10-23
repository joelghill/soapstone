import { Agent } from "@atproto/api";
import { TID } from "@atproto/common";
import { OAuthClient, SignedJwt } from "@atproto/oauth-client";
import { Record as PostRecord } from "#/lexicon/types/social/soapstone/feed/post";
import { Message } from "#/lexicon/types/social/soapstone/message/defs";
import { Location } from "#/lexicon/types/social/soapstone/location/defs";
import { AuthError } from "#/lib/errors";

export interface AtProtoWriteResult {
  uri: string;
  cid: string;
}

/**
 * Repository for managing AT Protocol operations.
 */
export class AtProtoRepository {
  constructor(private oauth: OAuthClient) {}

  async decodeJWT(token: SignedJwt): Promise<any> {
    if (!this.oauth.keyset) {
      throw new Error("OAuth client keyset is not initialized");
    }
    try {
      const decoded = await this.oauth.keyset?.verifyJwt(token);
      return decoded;
    } catch (err) {
      throw new Error(`Failed to decode JWT: ${err}`);
    }
  }

  /**
   * Creates a post record in the user's AT Protocol repository.
   * @param did - The user to create the post for.
   * @param message - The message content.
   * @param location - The location data.
   * @returns A promise that resolves to the write result.
   */
  async createPostRecord(
    did: string,
    message: Message,
    location: Location,
  ): Promise<AtProtoWriteResult> {
    // Get authenticated agent for user
    const agent = await this.getSessionAgent(did);
    // Create PostRecord
    const record = this.buildPostRecord(message, location);

    // Generate record key
    const rkey = TID.nextStr();

    // Write the PostRecord to the user's PDS using agent
    try {
      const putRes = await agent.com.atproto.repo.putRecord({
        repo: agent.assertDid,
        collection: "social.soapstone.feed.post",
        rkey,
        record,
        validate: false,
      });

      return {
        uri: putRes.data.uri,
        cid: putRes.data.cid,
      };
    } catch (err) {
      throw new Error(`Failed to write post record: ${err}`);
    }
  }

  /**
   * Deletes a record from the user's AT Protocol repository.
   * @param did - The did of the user to delete the record for.
   * @param collection - The collection name.
   * @param rkey - The record key.
   * @returns A promise that resolves when the record is deleted.
   */
  async deleteRecord(
    did: string,
    collection: string,
    rkey: string,
  ): Promise<void> {
    try {
      const agent = await this.getSessionAgent(did);
      await agent.com.atproto.repo.deleteRecord({
        repo: agent.assertDid,
        collection,
        rkey,
      });
    } catch (err) {
      throw new Error(`Failed to delete record: ${err}`);
    }
  }

  /**
   * Builds a PostRecord from message and location data.
   * @param message - The message content.
   * @param location - The location data.
   * @returns The constructed PostRecord.
   */
  private buildPostRecord(message: Message, location: Location): PostRecord {
    return {
      $type: "social.soapstone.feed.post",
      message: message,
      location: location,
      createdAt: new Date().toISOString(),
    };
  }

  private async getSessionAgent(did: string): Promise<Agent> {
    try {
      const oauthSession = await this.oauth.restore(did);
      return new Agent(oauthSession);
    } catch (err) {
      throw new AuthError(`oauth restore failed: ${err}`);
    }
  }
}
