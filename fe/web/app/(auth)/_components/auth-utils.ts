export type AuthApiError = {
  response?: {
    status?: number;
    data?: {
      error?: {
        code?: string;
        message?: string | string[];
      };
    };
  };
};

export type GoogleCredentialResponse = {
  credential: string;
};

export type GoogleIdentityApi = {
  accounts: {
    id: {
      initialize: (options: {
        client_id?: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: {
          theme: 'outline' | 'filled_blue' | 'filled_black';
          size: 'large' | 'medium' | 'small';
          width?: number;
          text?: 'signin_with' | 'signup_with' | 'continue_with';
          shape?: 'rectangular' | 'pill';
        },
      ) => void;
      prompt: () => void;
    };
  };
};

export function getAuthErrorMessage(error: unknown, fallback: string) {
  const authError = error as AuthApiError;
  const apiMessage = authError.response?.data?.error?.message;
  const message = Array.isArray(apiMessage) ? apiMessage.join('; ') : apiMessage;
  const friendlyMessage = getFriendlyAuthMessage({
    code: authError.response?.data?.error?.code,
    message,
    status: authError.response?.status,
    fallback,
  });

  if (friendlyMessage) {
    return friendlyMessage;
  }

  if (error instanceof Error && error.message && !isTechnicalAuthMessage(error.message)) {
    return error.message;
  }

  return fallback;
}

export function getAuthErrorCode(error: unknown) {
  const authError = error as AuthApiError;
  return authError.response?.data?.error?.code;
}

export function getGoogleIdentity() {
  if (typeof window === 'undefined') return undefined;
  return (window as Window & typeof globalThis & { google?: GoogleIdentityApi }).google;
}

function getFriendlyAuthMessage({
  code,
  message,
  status,
  fallback,
}: {
  code?: string;
  message?: string;
  status?: number;
  fallback: string;
}) {
  if (!message) {
    if (status === 401) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }
    return undefined;
  }

  if (isTechnicalAuthMessage(message)) {
    if (status === 401 || code === 'UNAUTHORIZED') {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }
    return fallback;
  }

  return message;
}

function isTechnicalAuthMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('refreshtoken') ||
    normalized.includes('refresh token') ||
    normalized.includes('must be a string') ||
    normalized.includes('should not be empty') ||
    normalized.includes('validation failed') ||
    normalized.includes('jwt') ||
    normalized.includes('unauthorizedexception') ||
    normalized.includes('badrequestexception')
  );
}
