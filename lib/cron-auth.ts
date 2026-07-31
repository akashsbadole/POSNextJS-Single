import { NextRequest, NextResponse } from "next/server";

export function checkCronSecret(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
