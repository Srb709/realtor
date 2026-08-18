import { NextResponse } from "next/server";
import { getFubPeople } from "../../../../lib/fub";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.FUB_API_KEY) {
    return NextResponse.json(
      { connected: false, reason: "FUB_API_KEY is not configured" },
      { status: 503 }
    );
  }

  try {
    const result = await getFubPeople(1);
    return NextResponse.json({
      connected: true,
      sampleCount: result.people?.length ?? 0,
      message: "Follow Up Boss read connection is working.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        reason: error instanceof Error ? error.message : "Unknown FUB error",
      },
      { status: 502 }
    );
  }
}
