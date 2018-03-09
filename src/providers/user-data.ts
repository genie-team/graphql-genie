import { get, remove, set } from './storage';

const HAS_LOGGED_IN = 'hasLoggedIn';
const HAS_SEEN_TUTORIAL = 'hasSeenTutorial';

export class UserDataController {
  private favorites: string[] = [];

  hasFavorite(sessionName: string): boolean {
    return (this.favorites.indexOf(sessionName) > -1);
  }

  addFavorite(sessionName: string): void {
    this.favorites.push(sessionName);
  }

  removeFavorite(sessionName: string): void {
    const index = this.favorites.indexOf(sessionName);
    if (index > -1) {
      this.favorites.splice(index, 1);
    }
  }

  login(username: string): Promise<void> {
     return set(HAS_LOGGED_IN, true).then(() => {
       this.setUsername(username);
       // return this.events.publish('user:login');
       window.dispatchEvent(new Event('user:login'));
    });
  }

  signup(username: string): Promise<void> {
    return set(HAS_LOGGED_IN, true).then(() => {
      this.setUsername(username);
      // return this.events.publish('user:signup');
      window.dispatchEvent(new Event('user:signup'));
    });
  }

  logout(): Promise<void> {
    return remove(HAS_LOGGED_IN).then(() => {
      return remove('username');
    }).then(() => {
      // this.events.publish('user:logout');
      window.dispatchEvent(new Event('user:logout'));
    });
  }

  setUsername(username: string): Promise<void> {
    return set('username', username);
  }

  getUsername(): Promise<string> {
    return get('username').then((value) => {
      return value;
    });
  }

  isLoggedIn(): Promise<boolean> {
    return get(HAS_LOGGED_IN).then((value) => {
      return value === true;
    });
  }

  hasSeenTutorial(value: boolean): Promise<void> {
    return set(HAS_SEEN_TUTORIAL, value);
  }

  checkHasSeenTutorial(): Promise<boolean> {
    return get(HAS_SEEN_TUTORIAL).then((value) => !!value);
  }
}

export const UserData = new UserDataController();
