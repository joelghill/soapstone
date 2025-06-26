import type {
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from "@atproto/oauth-client-node";
import type { Database } from "#/db";

export class StateStore implements NodeSavedStateStore {
  constructor(private db: Database) {}
  async get(key: string): Promise<NodeSavedState | undefined> {
    const result = await this.db("auth_state")
      .select("key", "state")
      .where("key", key)
      .first();
    if (!result) return;
    return JSON.parse(result.state) as NodeSavedState;
  }
  async set(key: string, val: NodeSavedState) {
    const state = JSON.stringify(val);
    await this.db("auth_state")
      .insert({ key: key, state: state })
      .onConflict("key")
      .merge({ state });
  }
  async del(key: string) {
    await this.db("auth_state").where("key", key).del();
  }
}

export class SessionStore implements NodeSavedSessionStore {
  constructor(private db: Database) {}
  async get(key: string): Promise<NodeSavedSession | undefined> {
    const result = await this.db("auth_session")
      .withSchema("auth")
      .select("key", "session")
      .where("key", key)
      .first();
    if (!result) return;
    return JSON.parse(result.session) as NodeSavedSession;
  }
  async set(key: string, val: NodeSavedSession) {
    const session = JSON.stringify(val);
    await this.db("auth_session")
      .insert({ key: key, session: session })
      .onConflict("key")
      .merge({ session });
  }
  async del(key: string) {
    await this.db("auth_session").where("key", key).del();
  }
}
