// Types
export interface Post {
  uri: string;
  authorDid: string;
  text: string;
  location: GeoJSON.Point;
  elevation: number | null;
  createdAt: string;
  indexedAt: string;
}

export interface Rating {
  uri: string;
  authorDid: string;
  postUri: string;
  positive: boolean;
  createdAt: string;
  indexedAt: string;
}
