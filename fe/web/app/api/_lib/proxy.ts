import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const TRUSTED_PROXY_CIDRS = (process.env.TRUSTED_PROXY_CIDRS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const ACCESS_TOKEN_COOKIE = "hs_access_token";
const REFRESH_TOKEN_COOKIE = "hs_refresh_token";
const SESSION_MODE_COOKIE = "hs_session_mode";
const AUTH_TOKEN_PATHS = new Set([
  "/auth/login",
  "/auth/google",
  "/auth/verify-otp",
  "/auth/refresh",
]);
const BackendPayloadSchema = z
  .object({
    success: z.boolean().optional(),
    data: z.unknown().optional(),
    message: z.string().optional(),
    error: z.unknown().optional(),
  })
  .passthrough();

function authCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", authCookieOptions(0));
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", authCookieOptions(0));
  response.cookies.set(SESSION_MODE_COOKIE, "", authCookieOptions(0));
}

function readJsonBody(text: string) {
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function getPayloadData(payload: ApiPayload) {
  return payload?.data && typeof payload.data === "object"
    ? payload.data
    : payload;
}

function decodeJwtRole(token: string): string | null {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    const payloadString = Buffer.from(payloadBase64, "base64").toString("utf8");
    const payload = JSON.parse(payloadString);
    return payload.role || null;
  } catch {
    return null;
  }
}

function getAuthTokens(payload: ApiPayload) {
  const data = getPayloadData(payload);
  const accessToken =
    typeof data?.accessToken === "string" ? data.accessToken : null;
  const refreshToken =
    typeof data?.refreshToken === "string" ? data.refreshToken : null;

  return {
    accessToken,
    refreshToken,
    role: accessToken ? decodeJwtRole(accessToken) : null,
  };
}

function stripRefreshToken(payload: ApiPayload) {
  const data = getPayloadData(payload);
  if (data && typeof data === "object") {
    delete data.refreshToken;
  }
}

function storeAuthCookies(
  response: NextResponse,
  tokens: {
    accessToken: string | null;
    refreshToken: string | null;
    role: string | null;
  },
  rememberMe: boolean,
) {
  const isAdminOrStaff = tokens.role === "ADMIN" || tokens.role === "STAFF";
  const refreshMaxAge = isAdminOrStaff ? 2 * 60 * 60 : 7 * 24 * 60 * 60;

  if (tokens.accessToken) {
    response.cookies.set(
      ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      authCookieOptions(rememberMe ? 30 * 60 : undefined),
    );
  }

  if (tokens.refreshToken) {
    // Admin/Staff: 2 hours (2 * 60 * 60)
    // Customer/Provider: 7 days (7 * 24 * 60 * 60)
    response.cookies.set(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      authCookieOptions(rememberMe ? refreshMaxAge : undefined),
    );
  }

  response.cookies.set(
    SESSION_MODE_COOKIE,
    rememberMe ? "persistent" : "session",
    authCookieOptions(rememberMe ? refreshMaxAge : undefined),
  );
}

function parseIp(ip: string): { version: 4 | 6; value: bigint } | null {
  const trimmed = ip.trim();
  const ipv4Parts = trimmed.split(".");
  if (
    ipv4Parts.length === 4 &&
    ipv4Parts.every((part) => /^(0|[1-9]\d{0,2})$/.test(part))
  ) {
    const numbers = ipv4Parts.map(Number);
    if (numbers.every((part) => part >= 0 && part <= 255)) {
      return {
        version: 4,
        value:
          (BigInt(numbers[0]) << 24n) |
          (BigInt(numbers[1]) << 16n) |
          (BigInt(numbers[2]) << 8n) |
          BigInt(numbers[3]),
      };
    }
  }

  if (!trimmed.includes(":")) return null;
  const [left, right = ""] = trimmed.split("::");
  if (trimmed.split("::").length > 2) return null;
  const leftParts = left ? left.split(":") : [];
  const rightParts = right ? right.split(":") : [];
  const parts = trimmed.includes("::")
    ? [...leftParts, ...Array(8 - leftParts.length - rightParts.length).fill("0"), ...rightParts]
    : leftParts;
  if (parts.length !== 8 || parts.some((part) => !/^[0-9a-f]{1,4}$/i.test(part))) {
    return null;
  }

  return {
    version: 6,
    value: parts.reduce(
      (value, part) => (value << 16n) | BigInt(parseInt(part, 16)),
      0n,
    ),
  };
}

function isTrustedProxy(ip: string): boolean {
  const parsedIp = parseIp(ip);
  if (!parsedIp) return false;

  return TRUSTED_PROXY_CIDRS.some((cidr) => {
    const [networkValue, prefixValue] = cidr.split("/");
    const network = parseIp(networkValue);
    if (!network || network.version !== parsedIp.version) return false;
    const bits = network.version === 4 ? 32 : 128;
    const prefix = prefixValue === undefined ? bits : Number(prefixValue);
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > bits) return false;
    const mask =
      prefix === 0
        ? 0n
        : ((1n << BigInt(bits)) - 1n) ^ ((1n << BigInt(bits - prefix)) - 1n);
    return (parsedIp.value & mask) === (network.value & mask);
  });
}

function getTrustedClientIp(req: NextRequest): string {
  const forwardedChain = (req.headers.get("x-forwarded-for") || "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => parseIp(value) !== null);

  if (forwardedChain.length < 2 || !isTrustedProxy(forwardedChain.at(-1)!)) {
    return "unknown";
  }

  for (let index = forwardedChain.length - 2; index >= 0; index -= 1) {
    if (!isTrustedProxy(forwardedChain[index])) return forwardedChain[index];
  }

  return "unknown";
}

/**
 * Proxy request tới NestJS backend.
 * Giữ nguyên method, headers (Authorization), body.
 * Trả về response từ BE nguyên bản.
 *
 * Production-ready: ẩn BE URL khỏi client, forward IP cho audit log,
 * hỗ trợ multipart/form-data (file upload).
 */
export async function proxyToBackend(req: NextRequest, backendPath: string) {
  const headers: Record<string, string> = {};
  const cookieStore = await cookies();

  // Forward auth header. Browser callers can rely on httpOnly cookies; socket
  // callers can still pass the short-lived in-memory access token explicitly.
  const cookieAccessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const auth =
    req.headers.get("authorization") ||
    (cookieAccessToken ? `Bearer ${cookieAccessToken}` : null);
  if (auth) headers["Authorization"] = auth;

  // Only trust a client IP extracted from a configured reverse-proxy chain.
  headers["X-Forwarded-For"] = getTrustedClientIp(req);

  // Forward Idempotency-Key if present
  const idempotencyKey =
    req.headers.get("idempotency-key") || req.headers.get("x-idempotency-key");
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  // Forward body for non-GET requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      // Guard against oversized uploads before buffering formData (55MB max)
      const contentLength = req.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > 55 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PAYLOAD_TOO_LARGE",
              message:
                "Kích thước tệp tải lên vượt quá giới hạn cho phép (tối đa 50MB).",
            },
          },
          { status: 413 },
        );
      }

      // FormData — pass through, let fetch set boundary
      const formData = await req.formData();
      fetchOptions.body = formData as ApiPayload;
      // Do NOT set Content-Type — fetch will auto-set with correct boundary
    } else {
      // JSON or other text body
      headers["Content-Type"] = contentType || "application/json";
      const bodyText = await req.text();
      if (backendPath === "/auth/refresh") {
        const body = readJsonBody(bodyText);
        const refreshToken =
          typeof body.refreshToken === "string" && body.refreshToken.trim()
            ? body.refreshToken
            : cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

        if (!refreshToken) {
          const missingTokenResponse = NextResponse.json(
            {
              success: false,
              error: {
                code: "UNAUTHORIZED",
                message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
              },
            },
            { status: 401 },
          );
          clearAuthCookies(missingTokenResponse);
          return missingTokenResponse;
        }

        body.refreshToken = refreshToken;
        fetchOptions.body = JSON.stringify(body);
      } else {
        fetchOptions.body = bodyText;
      }
    }
  } else {
    headers["Content-Type"] = "application/json";
  }

  fetchOptions.headers = headers;

  // Build URL with query params
  const url = new URL(backendPath, BACKEND_URL);
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), fetchOptions);
    const responseContentType =
      response.headers.get("content-type") || "application/json";

    // Stream binary responses (PDF, Excel)
    if (
      responseContentType.includes("application/pdf") ||
      responseContentType.includes("spreadsheetml") ||
      responseContentType.includes("octet-stream")
    ) {
      const buffer = await response.arrayBuffer();
      const resHeaders: Record<string, string> = {
        "Content-Type": responseContentType,
      };
      const disposition = response.headers.get("content-disposition");
      if (disposition) resHeaders["Content-Disposition"] = disposition;

      return new NextResponse(buffer, {
        status: response.status,
        headers: resHeaders,
      });
    }

    // JSON/text responses
    const data = await response.text();
    let responseBody = data;
    let parsedPayload: ApiPayload = null;
    let authTokens: ReturnType<typeof getAuthTokens> | null = null;

    if (responseContentType.includes("application/json")) {
      try {
        parsedPayload = BackendPayloadSchema.parse(
          JSON.parse(data),
        ) as ApiPayload;
        if (response.ok && AUTH_TOKEN_PATHS.has(backendPath)) {
          authTokens = getAuthTokens(parsedPayload);
          stripRefreshToken(parsedPayload);
        }
      } catch {
        parsedPayload = null;
      }
    }

    if (parsedPayload && responseContentType.includes("application/json")) {
      responseBody = JSON.stringify(parsedPayload);
    }

    const isNoContent =
      response.status === 204 ||
      response.status === 205 ||
      response.status === 304;
    const proxiedResponse = new NextResponse(
      isNoContent ? null : responseBody,
      {
        status: response.status,
        headers: isNoContent
          ? undefined
          : {
              "Content-Type": responseContentType,
            },
      },
    );

    if (authTokens) {
      const requestedRememberMe = req.headers.get("x-remember-me");
      const rememberMe =
        requestedRememberMe === null
          ? cookieStore.get(SESSION_MODE_COOKIE)?.value !== "session"
          : requestedRememberMe === "true";
      storeAuthCookies(proxiedResponse, authTokens, rememberMe);
    }

    if (
      backendPath === "/auth/logout" ||
      (backendPath === "/auth/refresh" && response.status === 401)
    ) {
      clearAuthCookies(proxiedResponse);
    }

    return proxiedResponse;
  } catch (error) {
    console.error(`[BFF Proxy] Failed to reach backend: ${error}`);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Không thể kết nối đến server",
        },
      },
      { status: 502 },
    );
  }
}
