import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/api/_lib/proxy';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quoteId: string }> },
) {
  const { id, quoteId } = await params;
  return proxyToBackend(req, `/bookings/${id}/supplementary-quotes/${quoteId}/reject`);
}

