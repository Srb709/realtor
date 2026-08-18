import { NextRequest, NextResponse } from "next/server";
import { getFubPeople, mergeFubTag } from "../../../../lib/fub";
import { classifyLead } from "../../../../lib/leadClassifier";
import { matchBestContent } from "../../../../lib/contentMatcher";
import { marketContent } from "../../../../content/marketContent";

export const dynamic = "force-dynamic";

const TAG_BY_CONTENT_ID: Record<string, string> = {
  "montco-buyer-weekly": "Newsletter - Montco Buyer",
  "bucks-buyer-weekly": "Newsletter - Bucks Buyer",
  "bucks-seller-weekly": "Newsletter - Bucks Seller",
  "philly-buyer-weekly": "Newsletter - Philly Buyer",
  "philly-seller-weekly": "Newsletter - Philly Seller",
  "delco-buyer-weekly": "Newsletter - Delco Buyer",
  "delco-seller-weekly": "Newsletter - Delco Seller",
  "chester-buyer-weekly": "Newsletter - Chester Buyer",
  "chester-seller-weekly": "Newsletter - Chester Seller",
  "regional-buyer-fallback": "Newsletter - SEPA Buyer",
  "regional-seller-fallback": "Newsletter - SEPA Seller",
};

function isAuthorized(request: NextRequest) {
  const expected = process.env.CONTENT_ADMIN_TOKEN;
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

async function buildPlan(limit = 25) {
  const result = await getFubPeople(limit);
  const people = result.people ?? [];
  const plan: Array<{ personId: number; tag: string }> = [];
  const counts: Record<string, number> = {};
  let blocked = 0;
  let unmatched = 0;

  for (const person of people) {
    const id = typeof person.id === "number" ? person.id : undefined;
    if (!id) continue;

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

    const tag = TAG_BY_CONTENT_ID[match.content.id];
    if (!tag) {
      unmatched += 1;
      continue;
    }

    plan.push({ personId: id, tag });
    counts[tag] = (counts[tag] ?? 0) + 1;
  }

  return { plan, counts, blocked, unmatched, sampled: people.length };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await buildPlan(25);
  return NextResponse.json({
    mode: "dry-run",
    sampledContacts: data.sampled,
    eligibleToTag: data.plan.length,
    blocked: data.blocked,
    unmatched: data.unmatched,
    tagCounts: data.counts,
    note: "Dry run only. No FUB contacts were changed. Individual contact data is not returned."
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body?.confirm !== "APPLY_NEWSLETTER_TAGS") {
    return NextResponse.json(
      { error: "Confirmation phrase required. No changes made." },
      { status: 400 }
    );
  }

  const data = await buildPlan(25);
  const applied: Record<string, number> = {};
  let failed = 0;

  for (const item of data.plan) {
    try {
      await mergeFubTag(item.personId, item.tag);
      applied[item.tag] = (applied[item.tag] ?? 0) + 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({
    mode: "applied",
    changedContacts: data.plan.length - failed,
    failed,
    appliedTagCounts: applied,
    note: "Existing FUB tags were preserved using mergeTags=true. No emails were sent."
  });
}
