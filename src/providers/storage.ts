export function set(key: string, value: boolean | string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      localStorage.setItem(key, value.toString());
      resolve();
    } catch (err) {
      reject(`Couldnt store object ${err}`);
    }
  });
}

export function remove(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      localStorage.removeItem(key);
      resolve();
    } catch (err) {
      reject(`Couldnt remove object ${err}`)
    }
  });
}

export function get(key: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const item = localStorage.getItem(key);
      resolve(item);
    } catch (err) {
      reject(`Couldnt get object: ${err}`)
    }
  });
}