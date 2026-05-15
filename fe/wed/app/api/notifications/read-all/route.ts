import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/api/_lib/proxy';

export async function PATCH(req: NextRequest) {
  return proxyToBackend(req, '/notifications/read-all');
}
