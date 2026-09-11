import { AxiosError } from 'axios';
import { ApiError } from '@/types';

/**
 * Chuẩn hóa và bóc tách thông báo lỗi từ API Backend
 * Hỗ trợ định dạng `{ success: false, error: { code, message } }`
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
): string {
  if (!error) return fallback;

  if (typeof error === 'string') return error;

  const axiosError = error as AxiosError<
    ApiError | { message?: string; error?: { message?: string; code?: string } }
  >;

  if (axiosError?.response?.data) {
    const data = axiosError.response.data;
    if (typeof data === 'object' && data !== null) {
      if ('error' in data && data.error?.message) {
        return data.error.message;
      }
      if ('message' in data && typeof data.message === 'string') {
        return data.message;
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/**
 * Trích xuất mã lỗi error code chuẩn hóa (ErrorCodes) từ API Backend
 */
export function getApiErrorCode(error: unknown): string | null {
  const axiosError = error as AxiosError<
    ApiError | { error?: { code?: string } }
  >;
  return axiosError?.response?.data?.error?.code ?? null;
}
