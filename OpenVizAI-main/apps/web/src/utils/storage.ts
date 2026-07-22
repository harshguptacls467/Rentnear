import { STORAGE_KEYS, type StorageKey } from "../constants/storage";

export const getLocalStorageItem = (key: StorageKey): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setLocalStorageItem = (key: StorageKey, value: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
};

export const removeLocalStorageItem = (key: StorageKey): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage errors
  }
};

// Convenience helpers for auth tokens
export const getAccessToken = () => getLocalStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
export const getRefreshToken = () =>
  getLocalStorageItem(STORAGE_KEYS.REFRESH_TOKEN);

