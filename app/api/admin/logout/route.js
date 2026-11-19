import { NextResponse } from "next/server";
import { clearAdminCookie, revokeSession } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const revoked = await revokeSession(request);
  const response = NextResponse.json({ ok: true, revoked }, { headers: { "Cache-Control": "no-store" } });
  clearAdminCookie(response);
  return response;
}