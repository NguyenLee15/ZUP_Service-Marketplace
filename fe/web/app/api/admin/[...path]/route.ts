import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/api/_lib/proxy';

// Catch-all route for /api/admin/* — proxies all admin endpoints
// Handles: users, staffs, kyc, bookings, disputes, settings, dashboard
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const backendPath = `/admin/${path.join('/')}`;
  return proxyToBackend(req, backendPath);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const backendPath = `/admin/${path.join('/')}`;
  return proxyToBackend(req, backendPath);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const backendPath = `/admin/${path.join('/')}`;
  return proxyToBackend(req, backendPath);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const backendPath = `/admin/${path.join('/')}`;
  return proxyToBackend(req, backendPath);
}
