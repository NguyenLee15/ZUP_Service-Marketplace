import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const ACCESS_TOKEN_COOKIE = "hs_access_token";
const REFRESH_TOKEN_COOKIE = "hs_refresh_token";
const AUTH_TOKEN_PATHS = new Set([
  "/auth/login",
  "/auth/google",
  "/auth/verify-otp",
  "/auth/refresh",
]);

function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", authCookieOptions(0));
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", authCookieOptions(0));
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

function getAuthTokens(payload: ApiPayload) {
  const data = getPayloadData(payload);
  return {
    accessToken:
      typeof data?.accessToken === "string" ? data.accessToken : null,
    refreshToken:
      typeof data?.refreshToken === "string" ? data.refreshToken : null,
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
  tokens: { accessToken: string | null; refreshToken: string | null },
) {
  if (tokens.accessToken) {
    response.cookies.set(
      ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      authCookieOptions(30 * 60),
    );
  }

  if (tokens.refreshToken) {
    response.cookies.set(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      authCookieOptions(7 * 24 * 60 * 60),
    );
  }
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

  // Forward IP for audit logs
  const clientIp =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  headers["X-Forwarded-For"] = clientIp;

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  // Forward body for non-GET requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
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
        parsedPayload = JSON.parse(data);
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

    const proxiedResponse = new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": responseContentType,
      },
    });

    if (authTokens) {
      storeAuthCookies(proxiedResponse, authTokens);
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
