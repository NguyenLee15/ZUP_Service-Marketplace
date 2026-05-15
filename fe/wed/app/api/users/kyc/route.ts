import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/api/_lib/proxy';

export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/users/kyc');
}

export async function POST(req: NextRequest) {
  return proxyToBackend(req, '/users/kyc');
}
