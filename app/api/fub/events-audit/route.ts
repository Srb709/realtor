import { NextResponse } from "next/server";
import { fubGet } from "../../../../lib/fub";

export const dynamic = "force-dynamic";

type EventRecord = Record<string, unknown>;
type EventsResponse = { events?: EventRecord[]; _metadata?: Record<string, unknown> };

function increment(map: Record<string, number>, value: unknown) {
  if (typeof value !== "string") return;
  const key = value.trim();
  if (!key) return;
  map[key] = (map[key] ?? 0) + 1;
}

function sortedCounts(map: Record<string, number>, limit = 50) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function collectKeys(target: Set<string>, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  Object.keys(value as Record<string, unknown>).forEach((key) => target.add(key));
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
    const types = [
      "Property Inquiry",
      "Viewed Property",
      "Saved Property",
      "Property Search",
      "Saved Property Search",
    ].join(",");

    const result = await fubGet<EventsResponse>(
      `/events?limit=100&type=${encodeURIComponent(types)}`
    );
    const events = result.events ?? [];

    const eventFields = new Set<string>();
    const eventTypeCounts: Record<string, number> = {};
    const propertyCityCounts: Record<string, number> = {};
    const propertyStateCounts: Record<string, number> = {};
    const propertyZipCounts: Record<string, number> = {};
    const propertySearchCityCounts: Record<string, number> = {};
    const propertySearchStateCounts: Record<string, number> = {};
    const propertySearchZipCounts: Record<string, number> = {};
    const propertyFields = new Set<string>();
    const propertySearchFields = new Set<string>();

    let eventsWithProperty = 0;
    let eventsWithPropertySearch = 0;
    let eventsWithPersonLink = 0;

    for (const event of events) {
      collectKeys(eventFields, event);
      increment(eventTypeCounts, event.type);
      if (event.personId !== undefined || event.person !== undefined) eventsWithPersonLink += 1;

      const property = event.property;
      if (property && typeof property === "object" && !Array.isArray(property)) {
        eventsWithProperty += 1;
        const p = property as Record<string, unknown>;
        collectKeys(propertyFields, p);
        increment(propertyCityCounts, firstString(p, ["city", "locality"]));
        increment(propertyStateCounts, firstString(p, ["state", "region"]));
        increment(propertyZipCounts, firstString(p, ["zip", "zipcode", "postalCode", "postal_code", "code"]));
      }

      const propertySearch = event.propertySearch;
      if (propertySearch && typeof propertySearch === "object" && !Array.isArray(propertySearch)) {
        eventsWithPropertySearch += 1;
        const s = propertySearch as Record<string, unknown>;
        collectKeys(propertySearchFields, s);
        increment(propertySearchCityCounts, firstString(s, ["city", "cities", "location", "area"]));
        increment(propertySearchStateCounts, firstString(s, ["state", "region"]));
        increment(propertySearchZipCounts, firstString(s, ["zip", "zipcode", "postalCode", "postal_code"]));
      }
    }

    return NextResponse.json({
      sampledEvents: events.length,
      eventsWithPersonLink,
      eventsWithProperty,
      eventsWithPropertySearch,
      eventFieldNames: Array.from(eventFields).sort(),
      eventTypeCounts: sortedCounts(eventTypeCounts),
      propertyFieldNames: Array.from(propertyFields).sort(),
      propertySearchFieldNames: Array.from(propertySearchFields).sort(),
      propertyCityCounts: sortedCounts(propertyCityCounts),
      propertyStateCounts: sortedCounts(propertyStateCounts),
      propertyZipCounts: sortedCounts(propertyZipCounts),
      propertySearchCityCounts: sortedCounts(propertySearchCityCounts),
      propertySearchStateCounts: sortedCounts(propertySearchStateCounts),
      propertySearchZipCounts: sortedCounts(propertySearchZipCounts),
      note: "Aggregate audit only. No person IDs, names, emails, phones, notes, street addresses, MLS IDs, or raw event records are returned.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown events audit error" },
      { status: 500 }
    );
  }
}
