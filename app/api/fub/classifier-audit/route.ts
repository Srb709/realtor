import { NextResponse } from "next/server";
import { getFubPeople } from "../../../../lib/fub";
import { classifyLead } from "../../../../lib/leadClassifier";

export const dynamic = "force-dynamic";

function increment(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

function sorted(map: Record<string, number>) {
  return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([value,count])=>({value,count}));
}

export async function GET() {
  try {
    const result = await getFubPeople(25);
    const people = result.people ?? [];

    const audience: Record<string, number> = {};
    const county: Record<string, number> = {};
    const priceBand: Record<string, number> = {};
    const timeframe: Record<string, number> = {};
    const confidence: Record<string, number> = {};
    let marketable = 0;
    let blocked = 0;

    for (const person of people) {
      const c = await classifyLead(person);
      increment(audience, c.audience);
      increment(county, c.county);
      increment(priceBand, c.priceBand);
      increment(timeframe, c.timeframe);
      increment(confidence, c.confidence);
      if (c.marketable) marketable += 1;
      else blocked += 1;
    }

    return NextResponse.json({
      sampledContacts: people.length,
      audience: sorted(audience),
      county: sorted(county),
      priceBand: sorted(priceBand),
      timeframe: sorted(timeframe),
      confidence: sorted(confidence),
      marketable,
      blocked,
      note: "Aggregate classifier audit only. No names, IDs, emails, phones, notes, addresses, or raw event records are returned."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown classifier audit error" },
      { status: 500 }
    );
  }
}
