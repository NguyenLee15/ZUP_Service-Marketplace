import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_IMAGE_HOSTS = new Set([
  'res.cloudinary.com',
  'api.dicebear.com',
  'lh3.googleusercontent.com',
  'i.pravatar.cc',
]);

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== '/_next/image') {
    return NextResponse.next();
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
  matcher: '/_next/image',
};
