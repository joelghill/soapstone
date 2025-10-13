import {
  PostView,
  CreatePostResponse,
} from "#/lexicon/types/social/soapstone/feed/defs";
import { Location } from "#/lexicon/types/social/soapstone/location/defs";
import { Message } from "#/lexicon/types/social/soapstone/message/defs";
import { PostRepository } from "#/lib/repositories/post_repo";
import { AtProtoRepository } from "#/lib/repositories/atproto_repo";

export interface ISoapStoneLexiconController {
  /**
   * Fetches posts by location within a specified radius for a user.
   * @param geoUri: string, - Geo URI of the location.
   * @param radius - Radius in meters to search for posts (optional).
   * @returns A promise that resolves to an array of PostView objects.
   */
  getPostsByLocation(
    geoUri: string,
    radius: number | undefined,
  ): Promise<PostView[]>;

  /**
   * Creates a new post with the given message and location for a user.
   * @param did - The DID of the user.
   * @param message - The message content of the post.
   * @param location - The location associated with the post.
   * @returns A promise that resolves to a CreatePostResponse object.
   */
  createPost(
    did: string,
    message: Message,
    location: Location,
  ): Promise<CreatePostResponse>;
}

export class SoapStoneLexiconController implements ISoapStoneLexiconController {
  private postRepository: PostRepository;
  private atprotoRepository: AtProtoRepository;

  constructor(
    postRepository: PostRepository,
    atprotoRepository: AtProtoRepository,
  ) {
    this.postRepository = postRepository;
    this.atprotoRepository = atprotoRepository;
  }

  /**
   * Fetches posts by location within a specified radius.
   * @param geoUri - The geo URI of the location (e.g., "geo:lat,lon").
   * @param radius - Radius in meters to search for posts (optional).
   * @returns A promise that resolves to an array of PostView objects.
   */
  public async getPostsByLocation(
    geoUri: string,
    radius: number | undefined,
  ): Promise<PostView[]> {
    const searchRadius = radius || 1000; // Default to 1km if not specified
    return await this.postRepository.getPostsByLocation(geoUri, searchRadius);
  }

  /**
   * Creates a new post with the given message and location.
   * @param did - The DID of the user.
   * @param message - The message content of the post.
   * @param location - The location associated with the post.
   * @returns A promise that resolves to a CreatePostResponse object.
   */
  public async createPost(
    did: string,
    message: Message,
    location: Location,
  ): Promise<CreatePostResponse> {
    // 1. Write the PostRecord to the user's PDS using agent
    const atprotoResult = await this.atprotoRepository.createPostRecord(
      did,
      message,
      location,
    );

    // 2. Insert the post into the database
    try {
      await this.postRepository.createPost({
        uri: atprotoResult.uri,
        authorDid: did,
        message: message,
        geoUri: location.uri,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      // Log the error but don't fail the request since the record was successfully written to PDS
      console.warn(
        "Failed to update database view; ignoring as it should be caught by the firehose:",
        err,
      );
    }

    return {
      uri: atprotoResult.uri,
      cid: atprotoResult.cid,
      validationStatus: "valid",
    };
  }
}
