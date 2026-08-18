import { NextResponse } from "next/server";
import { getFubPeople } from "../../../../lib/fub";
import { classifyLead } from "../../../../lib/leadClassifier";
import { matchBestContent } from "../../../../lib/contentMatcher";
import { marketContent } from "../../../../content/marketContent";

export const dynamic = "force-dynamic";

function increment(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

function sorted(map: Record<string, number>) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }));
}

export async function GET() {
  try {
    const result = await getFubPeople(25);
    const people = result.people ?? [];

    const matchedContent: Record<string, number> = {};
    const matchReasons: Record<string, number> = {};
    let matched = 0;
    let unmatched = 0;
    let blocked = 0;

    for (const person of people) {
      const lead = await classifyLead(person);
      if (!lead.marketable) {
        blocked += 1;
        continue;
      }

      const match = matchBestContent(lead, marketContent);
      if (!match) {
        unmatched += 1;
        continue;
      }

      matched += 1;
      increment(matchedContent, match.content.title);
      match.reasons.forEach((reason) => increment(matchReasons, reason));
    }

    return NextResponse.json({
      sampledContacts: people.length,
      matched,
      unmatched,
      blocked,
      matchedContent: sorted(matchedContent),
      matchReasons: sorted(matchReasons),
      note: "Aggregate-only content-match audit. No names, IDs, emails, phone numbers, notes, or addresses are returned."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown content matcher audit error" },
      { status: 500 }
    );
  }
}
