import { NextResponse } from "next/server";
import { getEnabledFeatures } from "@/lib/features";

export async function GET() {
  const features = await getEnabledFeatures();
  return NextResponse.json(features);
}
