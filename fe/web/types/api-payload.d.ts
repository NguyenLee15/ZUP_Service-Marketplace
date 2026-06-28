declare global {
  type ApiPayload = ReturnType<typeof JSON.parse>;
  type ApiQueryParams = Record<string, string | number | boolean | undefined>;
}

export {};
