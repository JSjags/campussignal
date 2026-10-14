import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supaAuth } from "@/lib/auth";
import { authCallbackMessage } from "@/lib/auth-callback";
export async function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  function failed(code?: string, name?: string) {
    console.warn("Auth callback failed", { code: code || "unknown", name });
    const url = new URL("/login", origin);
    url.searchParams.set("error", authCallbackMessage(code, name));
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  const upstreamError = req.nextUrl.searchParams.get("error_code");
  if (upstreamError) return failed(upstreamError);
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return failed("missing_code");
  try {
    const flowId = req.nextUrl.searchParams.get("sb_flow_id");
    const { error } = await (
      await supaAuth()
    ).auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
    if (error) return failed(error.code, error.name);
    (await cookies()).delete("campus_demo");
    const response = NextResponse.redirect(new URL("/home", origin));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return failed("network_error");
  }
}
