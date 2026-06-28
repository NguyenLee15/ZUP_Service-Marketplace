import { NextRequest } from "next/server";
import { proxyToBackend } from "../../_lib/proxy";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/settings/public-social");
}
