import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * Proxy request tới NestJS backend.
 * Giữ nguyên method, headers (Authorization), body.
 * Trả về response từ BE nguyên bản.
 *
 * Production-ready: ẩn BE URL khỏi client, forward IP cho audit log,
 * hỗ trợ multipart/form-data (file upload).
 */
export async function proxyToBackend(
  req: NextRequest,
  backendPath: string,
) {
  const headers: Record<string, string> = {};

  // Forward auth header
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  // Forward IP for audit logs
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  headers['X-Forwarded-For'] = clientIp;

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  // Forward body for non-GET requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      // FormData — pass through, let fetch set boundary
      const formData = await req.formData();
      fetchOptions.body = formData as any;
      // Do NOT set Content-Type — fetch will auto-set with correct boundary
    } else {
      // JSON or other text body
      headers['Content-Type'] = contentType || 'application/json';
      fetchOptions.body = await req.text();
    }
  } else {
    headers['Content-Type'] = 'application/json';
  }

  fetchOptions.headers = headers;

  // Build URL with query params
  const url = new URL(backendPath, BACKEND_URL);
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), fetchOptions);
    const responseContentType = response.headers.get('content-type') || 'application/json';

    // Stream binary responses (PDF, Excel)
    if (
      responseContentType.includes('application/pdf') ||
      responseContentType.includes('spreadsheetml') ||
      responseContentType.includes('octet-stream')
    ) {
      const buffer = await response.arrayBuffer();
      const resHeaders: Record<string, string> = {
        'Content-Type': responseContentType,
      };
      const disposition = response.headers.get('content-disposition');
      if (disposition) resHeaders['Content-Disposition'] = disposition;

      return new NextResponse(buffer, {
        status: response.status,
        headers: resHeaders,
      });
    }

    // JSON/text responses
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': responseContentType,
      },
    });
  } catch (error) {
    console.error(`[BFF Proxy] Failed to reach backend: ${error}`);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Không thể kết nối đến server' } },
      { status: 502 },
    );
  }
}
