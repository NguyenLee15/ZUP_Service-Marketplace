export function toRouteId(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? String(value) : null;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed === 'NaN') return null;
  return trimmed;
}

export function stableKey(value: unknown, fallback: string) {
  return toRouteId(value) || fallback;
}

// ─── Typed route builders ────────────────────────────────────────────────────
// Dùng thay thế cho `router.push('/booking/123' as any)`
// Expo Router typedRoutes: true → params phải truyền riêng
// ─────────────────────────────────────────────────────────────────────────────

export const routes = {
  tabs: {
    home: '/(tabs)/' as const,
    search: '/(tabs)/search' as const,
    bookings: '/(tabs)/bookings' as const,
    chat: '/(tabs)/chat' as const,
    profile: '/(tabs)/profile' as const,
  },
  booking: {
    detail: (id: string) =>
      ({ pathname: '/booking/[id]/' as const, params: { id } }) as const,
    track: (id: string) =>
      ({ pathname: '/booking/[id]/track' as const, params: { id } }) as const,
    review: (id: string) =>
      ({ pathname: '/booking/[id]/review' as const, params: { id } }) as const,
    dispute: (id: string) =>
      ({ pathname: '/booking/[id]/dispute' as const, params: { id } }) as const,
    create: (serviceId?: string) =>
      serviceId
        ? ({ pathname: '/booking/create' as const, params: { serviceId } } as const)
        : ('/booking/create' as const),
  },
  chatRoom: (id: string, providerName?: string) => ({
    pathname: '/chat-room/[id]/' as const,
    params: providerName ? { id, providerName } : { id },
  }),
  service: (id: string) =>
    ({ pathname: '/service/[id]/' as const, params: { id } }) as const,
  provider: (id: string) =>
    ({ pathname: '/provider/[id]/' as const, params: { id } }) as const,
  notifications: '/notifications' as const,
  chatbot: '/chatbot' as const,
  profile: {
    edit: '/profile/edit' as const,
    addresses: '/profile/addresses' as const,
    changePassword: '/profile/change-password' as const,
  },
  auth: {
    login: '/(auth)/login' as const,
    register: '/(auth)/register' as const,
    forgotPassword: '/(auth)/forgot-password' as const,
    otp: (email: string) => ({ pathname: '/(auth)/otp' as const, params: { email } }) as const,
  },
} as const;
