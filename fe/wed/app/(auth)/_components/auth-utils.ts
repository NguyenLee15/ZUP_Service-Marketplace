export type AuthApiError = {
  response?: {
    data?: {
      error?: {
        code?: string;
        message?: string;
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
    };
  };
};

export function getAuthErrorMessage(error: unknown, fallback: string) {
  const authError = error as AuthApiError;
  return authError.response?.data?.error?.message || fallback;
}

export function getAuthErrorCode(error: unknown) {
  const authError = error as AuthApiError;
  return authError.response?.data?.error?.code;
}

export function getGoogleIdentity() {
  if (typeof window === 'undefined') return undefined;
  return (window as Window & typeof globalThis & { google?: GoogleIdentityApi }).google;
}
