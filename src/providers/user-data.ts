import { get, remove, set } from './storage';

const HAS_LOGGED_IN = 'hasLoggedIn';
const HAS_SEEN_TUTORIAL = 'hasSeenTutorial';

export class UserDataController {
  private favorites = new Set<string>();

  hasFavorite(sessionName: string): boolean {
    return this.favorites.has(sessionName);
  }

  addFavorite(sessionName: string): void {
    this.favorites.add(sessionName);
  }

  removeFavorite(sessionName: string): void {
    this.favorites.delete(sessionName);
  }

  async login(username: string): Promise<void> {
    await set(HAS_LOGGED_IN, true);
    await this.setUsername(username);

    window.dispatchEvent(new Event('user:login'));
  }

  async signup(username: string): Promise<void> {
    await set(HAS_LOGGED_IN, true);

    await this.setUsername(username);
    window.dispatchEvent(new Event('user:signup'));
  }

  async logout(): Promise<void> {
    await remove(HAS_LOGGED_IN);
    await remove('username');

    window.dispatchEvent(new Event('user:logout'));
  }

  async setUsername(username: string): Promise<void> {
    await set('username', username);
  }

  async getUsername(): Promise<string> {
    return await get('username');
  }

  async isLoggedIn(): Promise<boolean> {
    const value = await get(HAS_LOGGED_IN);
    return value === true;
  }

  async hasSeenTutorial(value: boolean): Promise<void> {
    return await set(HAS_SEEN_TUTORIAL, value);
  }

  async checkHasSeenTutorial(): Promise<boolean> {
    const value = await get(HAS_SEEN_TUTORIAL);
    return !value;
  }
}

export const UserData = new UserDataController();
