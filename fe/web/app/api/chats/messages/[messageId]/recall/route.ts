import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/api/_lib/proxy';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const { messageId } = await params;
  return proxyToBackend(req, `/chats/messages/${messageId}/recall`);
}
