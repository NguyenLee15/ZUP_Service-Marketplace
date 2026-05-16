import { NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_lib/proxy";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "/chatbot/prepare");
}
