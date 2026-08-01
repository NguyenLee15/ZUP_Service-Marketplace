import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/api/_lib/proxy';

export async function POST(req: NextRequest) {
  return proxyToBackend(req, '/bookings/intent-extract');
}
