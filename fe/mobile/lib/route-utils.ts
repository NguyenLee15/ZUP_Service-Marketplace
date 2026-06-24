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

export const routes = {
  tabs: {
    home: '/(tabs)/' as const,
    bookings: '/(tabs)/bookings' as const,
    chat: '/(tabs)/chat' as const,
    wallet: '/(tabs)/wallet' as const,
    profile: '/(tabs)/profile' as const,
  },
  booking: {
    detail: (id: string) => ({ pathname: '/booking/[id]' as const, params: { id } }) as const,
  },
  service: {
    reviews: (id: string) => ({ pathname: '/service/[id]/reviews' as const, params: { id } }) as const,
    create: (id?: string, serviceData?: string) =>
      ({
        pathname: '/service/create' as const,
        params: serviceData ? { id: id ?? '', serviceData } : { id: id ?? '' },
      }) as const,
  },
  chatRoom: (id: string, customerName?: string, serviceName?: string, contextType?: string, serviceId?: string) => ({
    pathname: '/chat-room/[id]' as const,
    params: {
      id,
      ...(customerName ? { customerName } : {}),
      ...(serviceName ? { serviceName } : {}),
      ...(contextType ? { contextType } : {}),
      ...(serviceId ? { serviceId } : {}),
    },
  }),
  notifications: '/notifications' as const,
  services: '/services' as const,
  profile: {
    kyc: '/profile/kyc' as const,
    edit: '/profile/edit' as const,
    changePassword: '/profile/change-password' as const,
    analytics: '/profile/analytics' as const,
  },
  auth: {
    login: '/(auth)/login' as const,
    register: '/(auth)/register' as const,
    forgotPassword: '/(auth)/forgot-password' as const,
    otp: (email: string) => ({ pathname: '/(auth)/otp' as const, params: { email } }) as const,
    resetPassword: '/(auth)/reset-password' as const,
  },
} as const;
