import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/api/_lib/proxy';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) {
    return Response.json(
      { success: false, error: { message: 'Missing sessionId' } },
      { status: 400 }
    );
  }
  return proxyToBackend(req, `/chatbot/sessions/${sessionId}/messages`);
}
