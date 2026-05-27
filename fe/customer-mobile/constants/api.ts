import { Platform } from 'react-native';

const DEV_API_URL = Platform.select({
  android: 'http://10.0.2.2:3001',
  ios: 'http://localhost:3001',
  default: 'http://localhost:3001',
});

const PROD_API_URL = 'https://service-marketplace-qq3u.onrender.com';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? DEV_API_URL : PROD_API_URL);
export const WS_URL = API_BASE_URL;
