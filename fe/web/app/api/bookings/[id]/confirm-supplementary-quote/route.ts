import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/api/_lib/proxy';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.clone().json().catch(() => ({}));
  const quoteId = body.suppQuoteId || body.quoteId;
  return proxyToBackend(req, `/bookings/${id}/supplementary-quotes/${quoteId}/confirm`);
}

