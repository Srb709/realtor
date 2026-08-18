import { fubGet, type FubPerson } from "./fub";

type EventRecord = Record<string, unknown>;
type EventsResponse = { events?: EventRecord[] };

export type LeadCounty = "Philadelphia" | "Montgomery" | "Bucks" | "Delaware" | "Chester" | "Other" | "Unknown";

export type LeadClassification = {
  audience: "Buyer" | "Seller" | "Unknown";
  county: LeadCounty;
  priceBand: string;
  timeframe: string;
  marketable: boolean;
  confidence: "high" | "medium" | "low";
  signals: string[];
};

const COUNTY_ZIPS: Record<Exclude<LeadCounty, "Other" | "Unknown">, Set<string>> = {
  Philadelphia: new Set(["19102","19103","19104","19106","19107","19111","19114","19115","19116","19118","19119","19120","19121","19122","19123","19124","19125","19126","19127","19128","19129","19130","19131","19132","19133","19134","19135","19136","19137","19138","19139","19140","19141","19142","19143","19144","19145","19146","19147","19148","19149","19150","19151","19152","19153","19154"]),
  Montgomery: new Set(["19001","19002","19003","19004","19006","19009","19010","19012","19027","19031","19034","19035","19038","19040","19044","19046","19072","19075","19090","19095","19401","19403","19406","19422","19426","19428","19436","19437","19438","19440","19444","19446","19454","19462","19464","19468","19473","19477"]),
  Bucks: new Set(["18901","18902","18914","18923","18925","18929","18932","18938","18940","18944","18947","18951","18954","18966","18969","18972","18974","18976","18977","19007","19020","19021","19030","19047","19053","19054","19055","19056","19057","19067"]),
  Delaware: new Set(["19008","19013","19014","19015","19017","19018","19023","19026","19029","19032","19033","19036","19039","19041","19050","19060","19061","19063","19064","19070","19073","19074","19076","19078","19079","19081","19082","19083","19085","19086","19087","19094","19096"]),
  Chester: new Set(["19301","19310","19311","19312","19317","19319","19320","19330","19333","19335","19341","19342","19343","19344","19348","19355","19363","19365","19372","19380","19382","19390","19425","19460","19475"]),
};

const CITY_TO_COUNTY: Record<string, LeadCounty> = {
  philadelphia:"Philadelphia",
  abington:"Montgomery", glenside:"Montgomery", wyncote:"Montgomery", oreland:"Montgomery", dresher:"Montgomery", horsham:"Montgomery", jenkintown:"Montgomery", lansdale:"Montgomery", "lower gwynedd":"Montgomery", "upper gwynedd":"Montgomery", "maple glen":"Montgomery", "plymouth meeting":"Montgomery", "willow grove":"Montgomery", "huntingdon valley":"Montgomery",
  doylestown:"Bucks", warminster:"Bucks", bensalem:"Bucks", yardley:"Bucks", newtown:"Bucks", ivyland:"Bucks", perkasie:"Bucks", warrington:"Bucks", southampton:"Bucks", churchville:"Bucks", quakertown:"Bucks", richboro:"Bucks", langhorne:"Bucks", levittown:"Bucks", holland:"Bucks", chalfont:"Bucks",
  media:"Delaware", springfield:"Delaware", havertown:"Delaware", "drexel hill":"Delaware", swarthmore:"Delaware", aston:"Delaware", broomall:"Delaware",
  "west chester":"Chester", downingtown:"Chester", exton:"Chester", malvern:"Chester", phoenixville:"Chester", "kennett square":"Chester"
};

function asString(value: unknown) { return typeof value === "string" ? value.trim() : ""; }

function countyFromProperty(property: Record<string, unknown>): LeadCounty {
  const zip = asString(property.code || property.zip || property.zipcode);
  if (zip) {
    for (const [county, zips] of Object.entries(COUNTY_ZIPS) as Array<[Exclude<LeadCounty,"Other"|"Unknown">, Set<string>]>) {
      if (zips.has(zip)) return county;
    }
  }
  const city = asString(property.city).toLowerCase();
  if (city && CITY_TO_COUNTY[city]) return CITY_TO_COUNTY[city];
  const state = asString(property.state).toUpperCase();
  return state && state !== "PA" ? "Other" : "Unknown";
}

function getPriceBand(value?: number) {
  if (!value || !Number.isFinite(value)) return "Unknown";
  if (value < 300000) return "Under $300k";
  if (value < 400000) return "$300k-$399k";
  if (value < 500000) return "$400k-$499k";
  if (value < 650000) return "$500k-$649k";
  if (value < 800000) return "$650k-$799k";
  return "$800k+";
}

function median(values: number[]) {
  if (!values.length) return undefined;
  const sorted = [...values].sort((a,b)=>a-b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function classifyLead(person: FubPerson): Promise<LeadClassification> {
  const raw = person as Record<string, unknown>;
  const tags = Array.isArray(person.tags) ? person.tags.map(String) : [];
  const lowerTags = tags.map((t)=>t.toLowerCase());
  const rawType = asString(raw.type).toLowerCase();

  const audience: LeadClassification["audience"] =
    rawType === "seller" || lowerTags.includes("seller") ? "Seller" :
    rawType === "buyer" || lowerTags.includes("buyer") ? "Buyer" : "Unknown";

  const blocked = lowerTags.some((t)=>t.includes("dnc") || t.includes("unsub") || t.includes("do_not_contact") || t.includes("do not contact"));
  const signals: string[] = [];
  const countyVotes: Record<LeadCounty, number> = {Philadelphia:0,Montgomery:0,Bucks:0,Delaware:0,Chester:0,Other:0,Unknown:0};
  const eventPrices: number[] = [];

  if (raw.id !== undefined && raw.id !== null) {
    try {
      const result = await fubGet<EventsResponse>(`/events?limit=50&personId=${encodeURIComponent(String(raw.id))}&type=${encodeURIComponent("Property Inquiry,Viewed Property,Saved Property")}`);
      for (const event of result.events ?? []) {
        const property = event.property;
        if (!property || typeof property !== "object" || Array.isArray(property)) continue;
        const p = property as Record<string, unknown>;
        countyVotes[countyFromProperty(p)] += 1;
        const price = Number(p.price);
        if (Number.isFinite(price) && price > 0) eventPrices.push(price);
      }
      const useful = Object.entries(countyVotes).reduce((sum,[k,v]) => k === "Unknown" ? sum : sum + v, 0);
      if (useful) signals.push(`${useful} location-tagged property events`);
    } catch { signals.push("property events unavailable"); }
  }

  const ranked = (Object.entries(countyVotes) as Array<[LeadCounty, number]>).filter(([k])=>k !== "Unknown").sort((a,b)=>b[1]-a[1]);
  let county: LeadCounty = ranked[0]?.[1] ? ranked[0][0] : "Unknown";

  if (county === "Unknown" && Array.isArray(raw.addresses)) {
    for (const address of raw.addresses) {
      if (!address || typeof address !== "object") continue;
      const a = address as Record<string, unknown>;
      const fallback = countyFromProperty({code:a.code, city:a.city, state:a.state});
      if (fallback !== "Unknown") { county = fallback; signals.push("contact address fallback"); break; }
    }
  }

  const personPrice = Number(raw.price);
  const chosenPrice = median(eventPrices) ?? (Number.isFinite(personPrice) && personPrice > 0 ? personPrice : undefined);
  if (eventPrices.length) signals.push(`${eventPrices.length} property prices used`);
  else if (chosenPrice) signals.push("FUB lead price used");

  const timeframe = asString(raw.timeframeStatus) || "Unknown";
  const topVote = ranked[0]?.[1] ?? 0;
  const secondVote = ranked[1]?.[1] ?? 0;
  const confidence: LeadClassification["confidence"] = county !== "Unknown" && topVote >= 3 && topVote >= secondVote * 2 ? "high" : county !== "Unknown" ? "medium" : "low";

  return { audience, county, priceBand:getPriceBand(chosenPrice), timeframe, marketable:!blocked, confidence, signals };
}
