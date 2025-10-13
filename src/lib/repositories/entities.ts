// Types
export interface Status {
  uri: string;
  authorDid: string;
  status: string;
  createdAt: string;
  indexedAt: string;
}

export interface Post {
  uri: string;
  authorDid: string;
  text: string;
  location: GeoJSON.Point;
  elevation: number | null;
  createdAt: string;
  indexedAt: string;
}

export interface AuthSession {
  key: string;
  session: string;
}

export interface AuthState {
  key: string;
  state: string;
}

export interface Rating {
  uri: string;
  authorDid: string;
  postUri: string;
  positive: boolean;
  createdAt: string;
  indexedAt: string;
}
