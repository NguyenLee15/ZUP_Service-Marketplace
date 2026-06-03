import { useAuthStore } from "@/store/auth.store";

let refreshPromise: Promise<string | null> | null = null;

export async function ensureAccessToken() {
  const currentToken = useAuthStore.getState().accessToken;
  const currentUser = useAuthStore.getState().user;
  if (currentToken) return currentToken;
  if (!currentUser) return null;

  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then(async (response) => {
        if (!response.ok) {
          useAuthStore.getState().logout();
          return null;
        }

        const payload = await response.json();
        const accessToken = payload?.data?.accessToken || payload?.accessToken;
        if (typeof accessToken === "string" && accessToken) {
          useAuthStore.getState().setTokens(accessToken);
          return accessToken;
        }
        useAuthStore.getState().logout();
        return null;
      })
      .catch(() => {
        useAuthStore.getState().logout();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}
