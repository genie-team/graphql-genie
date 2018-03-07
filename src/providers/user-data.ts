import { get, remove, set } from './storage';

export class UserData {
  favorites: string[] = [];
  HAS_LOGGED_IN = 'hasLoggedIn';
  HAS_SEEN_TUTORIAL = 'hasSeenTutorial';

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
     return set(this.HAS_LOGGED_IN, true).then(() => {
       this.setUsername(username);
       // return this.events.publish('user:login');
       window.dispatchEvent(new Event('user:login'));
    });
  }

  signup(username: string): Promise<void> {
    return set(this.HAS_LOGGED_IN, true).then(() => {
      this.setUsername(username);
      // return this.events.publish('user:signup');
      window.dispatchEvent(new Event('user:signup'));
    });
  }

  logout(): Promise<void> {
    return remove(this.HAS_LOGGED_IN).then(() => {
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
    return get(this.HAS_LOGGED_IN).then((value) => {
      return value === 'true';
    });
  }

  hasSeenTutorial(value): Promise<void> {
    return set(this.HAS_SEEN_TUTORIAL, value);
  }

  checkHasSeenTutorial(): Promise<string> {
    return get(this.HAS_SEEN_TUTORIAL).then((value) => {
      return value;
    });
  }
}
