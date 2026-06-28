import { NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_lib/proxy";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackend(req, `/chatbot/sessions/${encodeURIComponent(id)}`);
}
