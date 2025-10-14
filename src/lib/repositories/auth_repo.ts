import type { Database } from "#/lib/db/postgres";
import { AuthSession, AuthState } from "./entities";

/**
 * Repository interface for authentication state and session management.
 * Works only with entity models from the entities file.
 */
export class AuthRepository {
  constructor(private db: Database) {}

  // Auth Session methods
  async getSavedSession(key: string): Promise<AuthSession | undefined> {
    const result = await this.db("auth_session")
      .select("key", "session")
      .where("key", key)
      .first();
    if (!result) return;
    return result as AuthSession;
  }

  async setSavedSession(key: string, session: string): Promise<void> {
    await this.db("auth_session")
      .insert({ key: key, session: session })
      .onConflict("key")
      .merge({ session: session });
  }

  async deleteSavedSession(key: string): Promise<void> {
    await this.db("auth_session").where("key", key).del();
  }

  // Auth State methods
  async getSavedState(key: string): Promise<AuthState | undefined> {
    const result = await this.db("auth_state")
      .select("key", "state")
      .where("key", key)
      .first();
    if (!result) return;
    return result as AuthState;
  }

  async setSavedState(key: string, state: string): Promise<void> {
    await this.db("auth_state")
      .insert({ key: key, state: state })
      .onConflict("key")
      .merge({ state: state });
  }

  async deleteSavedState(key: string): Promise<void> {
    await this.db("auth_state").where("key", key).del();
  }
}
