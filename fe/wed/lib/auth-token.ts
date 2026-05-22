import { useAuthStore } from '@/store/auth.store';

let refreshPromise: Promise<string | null> | null = null;

export async function ensureAccessToken() {
  const currentToken = useAuthStore.getState().accessToken;
  if (currentToken) return currentToken;

  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json();
        const accessToken = payload?.data?.accessToken || payload?.accessToken;
        if (typeof accessToken === 'string' && accessToken) {
          useAuthStore.getState().setTokens(accessToken);
          return accessToken;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}
