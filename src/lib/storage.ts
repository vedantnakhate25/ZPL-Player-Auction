/**
 * Safe sessionStorage helper that prevents crashes in private browsing,
 * restricted mobile webviews (WhatsApp, Instagram, etc.), or iframes.
 */
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch (e) {
      console.warn('sessionStorage.getItem blocked by browser sandbox:', e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('sessionStorage.setItem blocked by browser sandbox:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('sessionStorage.removeItem blocked by browser sandbox:', e);
    }
  }
};
