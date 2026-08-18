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

function firstString(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export async function GET() {
  try {
    const result = await getFubPeople(100);
    const people = result.people ?? [];

    const topLevelKeys = new Set<string>();
    const nestedKeys = new Set<string>();
    const customFieldKeys = new Set<string>();
    const addressFieldNames = new Set<string>();
    const stageCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const timeframeCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    const stateCounts: Record<string, number> = {};
    const zipCounts: Record<string, number> = {};
    const socialLocationCounts: Record<string, number> = {};
    const sourceHostCounts: Record<string, number> = {};

    let hasAddresses = 0;
    let hasCustomFields = 0;
    let hasTags = 0;
    let hasPrice = 0;
    let hasTimeframe = 0;
    let hasSourceUrl = 0;
    let hasSocialLocation = 0;

    for (const person of people) {
      Object.keys(person).forEach((key) => topLevelKeys.add(key));
      collectNestedKeys(nestedKeys, person);
      increment(stageCounts, person.stage);
      increment(sourceCounts, person.source);

      const raw = person as Record<string, unknown>;
      increment(typeCounts, raw.type);
      increment(timeframeCounts, raw.timeframeStatus);

      if (raw.price !== null && raw.price !== undefined && raw.price !== "") hasPrice += 1;
      if (typeof raw.timeframeStatus === "string" && raw.timeframeStatus.trim()) hasTimeframe += 1;

      if (Array.isArray(person.tags) && person.tags.length) {
        hasTags += 1;
        person.tags.forEach((tag) => increment(tagCounts, tag));
      }

      const addresses = raw.addresses;
      if (Array.isArray(addresses) && addresses.length) {
        hasAddresses += 1;
        for (const address of addresses) {
          if (!address || typeof address !== "object") continue;
          const a = address as Record<string, unknown>;
          Object.keys(a).forEach((key) => addressFieldNames.add(key));
          increment(cityCounts, firstString(a, ["city", "locality"]));
          increment(stateCounts, firstString(a, ["state", "region"]));
          increment(zipCounts, firstString(a, ["zip", "zipcode", "postalCode", "postal_code", "code"]));
        }
      }

      const customFields = raw.customFields;
      if (customFields && typeof customFields === "object" && !Array.isArray(customFields)) {
        hasCustomFields += 1;
        Object.keys(customFields as Record<string, unknown>).forEach((key) => customFieldKeys.add(key));
      }

      const socialData = raw.socialData;
      if (socialData && typeof socialData === "object" && !Array.isArray(socialData)) {
        const location = (socialData as Record<string, unknown>).location;
        if (typeof location === "string" && location.trim()) {
          hasSocialLocation += 1;
          increment(socialLocationCounts, location);
        }
      }

      if (typeof raw.sourceUrl === "string" && raw.sourceUrl.trim()) {
        hasSourceUrl += 1;
        try {
          const host = new URL(raw.sourceUrl).hostname.replace(/^www\./, "");
          increment(sourceHostCounts, host);
        } catch {
          increment(sourceHostCounts, "unparseable");
        }
      }
    }

    return NextResponse.json({
      sampledContacts: people.length,
      fieldCoverage: {
        contactsWithTags: hasTags,
        contactsWithAddresses: hasAddresses,
        contactsWithCustomFields: hasCustomFields,
        contactsWithPrice: hasPrice,
        contactsWithTimeframe: hasTimeframe,
        contactsWithSourceUrl: hasSourceUrl,
        contactsWithSocialLocation: hasSocialLocation,
      },
      topLevelFields: Array.from(topLevelKeys).sort(),
      nestedFieldNames: Array.from(nestedKeys).sort(),
      customFieldNames: Array.from(customFieldKeys).sort(),
      addressFieldNames: Array.from(addressFieldNames).sort(),
      stageCounts: sortedCounts(stageCounts),
      sourceCounts: sortedCounts(sourceCounts),
      tagCounts: sortedCounts(tagCounts),
      typeCounts: sortedCounts(typeCounts),
      timeframeCounts: sortedCounts(timeframeCounts),
      addressCityCounts: sortedCounts(cityCounts, 50),
      addressStateCounts: sortedCounts(stateCounts, 20),
      addressZipCounts: sortedCounts(zipCounts, 50),
      socialLocationCounts: sortedCounts(socialLocationCounts, 25),
      sourceUrlHostCounts: sortedCounts(sourceHostCounts, 25),
      note: "Privacy-safe aggregate audit only. No names, emails, phones, IDs, notes, street addresses, or source URLs are returned.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown audit error" },
      { status: 500 }
    );
  }
}
