import { NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_lib/proxy";

export const maxDuration = 60; // Allow AI up to 60s to respond

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "/chatbot/ask");
}
