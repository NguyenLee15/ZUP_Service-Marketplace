/**
 * API configuration
 * Ưu tiên EXPO_PUBLIC_API_URL khi test bằng thiết bị thật hoặc tunnel.
 *
 * Ví dụ:
 * - Cùng Wi-Fi: EXPO_PUBLIC_API_URL=http://<LAN_IP>:3001
 * - Khác mạng/5G: EXPO_PUBLIC_API_URL=https://<ngrok-or-cloudflare-url>
 * - Android emulator: fallback http://10.0.2.2:3001
 */
import { Platform } from "react-native";

const DEV_API_URL = Platform.select({
  android: "http://10.0.2.2:3001",
  ios: "http://localhost:3001",
  default: "http://localhost:3001",
});

// Production API URL (Render.com)
const PROD_API_URL = "https://service-marketplace-prod-free.onrender.com";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? DEV_API_URL : PROD_API_URL);
export const WS_URL = API_BASE_URL;
