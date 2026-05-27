export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const vietnamPhoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return emailRegex.test(normalizeEmail(email));
}

export function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '');
}

export function isValidVietnamPhone(phone: string) {
  return vietnamPhoneRegex.test(normalizePhone(phone));
}

export function digitsOnly(value: string, maxLength?: number) {
  const digits = value.replace(/\D/g, '');
  return typeof maxLength === 'number' ? digits.slice(0, maxLength) : digits;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: any } }).response;
    const message =
      response?.data?.error?.message ||
      response?.data?.message ||
      response?.data?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return fallback;
}
