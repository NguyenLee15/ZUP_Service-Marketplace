import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_IMAGE_HOSTS = new Set([
  'res.cloudinary.com',
  'api.dicebear.com',
  'lh3.googleusercontent.com',
  'i.pravatar.cc',
]);

function toCspOrigin(value?: string) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function uniqueCspValues(values: Array<string | null>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).join(' ');
}

function createCsp(nonce: string) {
  const connectSrc = uniqueCspValues([
    "'self'",
    toCspOrigin(process.env.NEXT_PUBLIC_APP_URL),
    toCspOrigin(process.env.BACKEND_URL),
    toCspOrigin(process.env.NEXT_PUBLIC_WS_URL),
    'https://accounts.google.com',
    'https://sandbox.vnpayment.vn',
    'wss:',
  ]);

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' https://accounts.google.com https://www.tiktok.com https://sp.zalo.me`,
    // 'unsafe-inline' is required for style-src because framer-motion, sonner, leaflet,
    // recharts and radix-ui all inject dynamic inline styles via JS at runtime.
    // Nonces only work on <style> tags, NOT on style="" attributes set by JavaScript.
    // script-src remains nonce-protected (the important XSS guard).
    `style-src 'self' 'unsafe-inline' https://accounts.google.com`,
    "img-src 'self' data: blob: https://res.cloudinary.com https://api.dicebear.com https://lh3.googleusercontent.com https://i.pravatar.cc https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://accounts.google.com https://www.facebook.com https://sandbox.vnpayment.vn",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' data: blob:",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== '/_next/image') {
    const nonce = btoa(crypto.randomUUID());
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set('Content-Security-Policy', createCsp(nonce));
    return response;
  }

  const imageUrl = request.nextUrl.searchParams.get('url');
  if (!imageUrl || imageUrl.startsWith('/')) {
    return NextResponse.next();
  }

  try {
    const parsedUrl = new URL(imageUrl);
    if (
      parsedUrl.protocol === 'https:' &&
      ALLOWED_IMAGE_HOSTS.has(parsedUrl.hostname)
    ) {
      return NextResponse.next();
    }
  } catch {
    return new NextResponse('Invalid image URL', { status: 400 });
  }

  return new NextResponse('Image host is not allowed', { status: 400 });
}

export const config = {
  matcher: [
    /*
     * Skip API routes and static files. CSP for rendered pages is nonce-based;
     * static assets still receive the fixed security headers from next.config.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|manifest.json|sw.js|workbox-.*).*)',
    '/_next/image',
  ],
};
