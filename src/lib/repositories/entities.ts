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
  // null = a discovery: the account has seen the post but not rated it.
  positive: boolean | null;
  createdAt: string;
  indexedAt: string;
}
