import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFeaturesForBusinessType, type BusinessType } from "@/lib/features";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const businessType = (session?.user?.businessType || "RETAIL_PHARMACY") as BusinessType;
  return NextResponse.json(getFeaturesForBusinessType(businessType));
}
