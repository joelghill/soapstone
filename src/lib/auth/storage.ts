import type {
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from "@atproto/oauth-client-node";

import { AuthRepository } from "#/lib/repositories/auth_repo";

export class StateStore implements NodeSavedStateStore {
  constructor(private authRepo: AuthRepository) {}

  async get(key: string): Promise<NodeSavedState | undefined> {
    const authState = await this.authRepo.getSavedState(key);
    if (!authState) return;
    return JSON.parse(authState.state) as NodeSavedState;
  }

  async set(key: string, val: NodeSavedState) {
    const state = JSON.stringify(val);
    await this.authRepo.setSavedState(key, state);
  }

  async del(key: string) {
    await this.authRepo.deleteSavedState(key);
  }
}

export class SessionStore implements NodeSavedSessionStore {
  constructor(private authRepo: AuthRepository) {}

  async get(key: string): Promise<NodeSavedSession | undefined> {
    const authSession = await this.authRepo.getSavedSession(key);
    if (!authSession) return;
    return JSON.parse(authSession.session) as NodeSavedSession;
  }

  async set(key: string, val: NodeSavedSession) {
    const session = JSON.stringify(val);
    await this.authRepo.setSavedSession(key, session);
  }

  async del(key: string) {
    await this.authRepo.deleteSavedSession(key);
  }
}
