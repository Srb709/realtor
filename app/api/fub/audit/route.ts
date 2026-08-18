import { NextResponse } from "next/server";
import { getFubPeople } from "../../../../lib/fub";

export const dynamic = "force-dynamic";

function increment(map: Record<string, number>, value: unknown) {
  if (typeof value !== "string") return;
  const key = value.trim();
  if (!key) return;
  map[key] = (map[key] ?? 0) + 1;
}

function sortedCounts(map: Record<string, number>, limit = 25) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function collectNestedKeys(target: Set<string>, value: unknown, prefix = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const full = prefix ? `${prefix}.${key}` : key;
    target.add(full);
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      collectNestedKeys(target, nested, full);
    }
  }
}

export async function GET() {
  try {
    const result = await getFubPeople(100);
    const people = result.people ?? [];

    const topLevelKeys = new Set<string>();
    const nestedKeys = new Set<string>();
    const customFieldKeys = new Set<string>();
    const stageCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};

    let hasAddresses = 0;
    let hasCustomFields = 0;
    let hasTags = 0;

    for (const person of people) {
      Object.keys(person).forEach((key) => topLevelKeys.add(key));
      collectNestedKeys(nestedKeys, person);
      increment(stageCounts, person.stage);
      increment(sourceCounts, person.source);

      if (Array.isArray(person.tags) && person.tags.length) {
        hasTags += 1;
        person.tags.forEach((tag) => increment(tagCounts, tag));
      }

      const raw = person as Record<string, unknown>;
      const addresses = raw.addresses;
      if (Array.isArray(addresses) && addresses.length) hasAddresses += 1;

      const customFields = raw.customFields;
      if (customFields && typeof customFields === "object" && !Array.isArray(customFields)) {
        hasCustomFields += 1;
        Object.keys(customFields as Record<string, unknown>).forEach((key) => customFieldKeys.add(key));
      }
    }

    return NextResponse.json({
      sampledContacts: people.length,
      fieldCoverage: {
        contactsWithTags: hasTags,
        contactsWithAddresses: hasAddresses,
        contactsWithCustomFields: hasCustomFields,
      },
      topLevelFields: Array.from(topLevelKeys).sort(),
      nestedFieldNames: Array.from(nestedKeys).sort(),
      customFieldNames: Array.from(customFieldKeys).sort(),
      stageCounts: sortedCounts(stageCounts),
      sourceCounts: sortedCounts(sourceCounts),
      tagCounts: sortedCounts(tagCounts),
      note: "No names, emails, phones, IDs, notes, or addresses are returned by this audit endpoint.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown audit error" },
      { status: 500 }
    );
  }
}
