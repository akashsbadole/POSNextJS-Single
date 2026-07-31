import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { getFeaturesForBusinessType, type BusinessType } from "@/lib/features";

export async function GET(_req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  const businessType = (session?.user?.businessType || "RETAIL_PHARMACY") as BusinessType;
  return NextResponse.json(getFeaturesForBusinessType(businessType));
}
