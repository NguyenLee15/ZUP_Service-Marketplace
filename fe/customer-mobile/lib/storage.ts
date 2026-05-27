import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'customer_access_token';
const REFRESH_TOKEN_KEY = 'customer_refresh_token';
const USER_KEY = 'customer_user';

export const storage = {
  async getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setTokens(accessToken: string, refreshToken: string) {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  async getUser<T = unknown>() {
    const value = await SecureStore.getItemAsync(USER_KEY);
    return value ? (JSON.parse(value) as T) : null;
  },

  async setUser(user: unknown) {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async clearAll() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  },
};
