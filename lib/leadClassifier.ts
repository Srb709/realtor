import { fubGet, type FubPerson } from "./fub";

type EventRecord = Record<string, unknown>;
type EventsResponse = { events?: EventRecord[] };

export type LeadCounty =
  | "Philadelphia"
  | "Montgomery"
  | "Bucks"
  | "Delaware"
  | "Chester"
  | "Other"
  | "Unknown";

export type LeadClassification = {
  audience: "Buyer" | "Seller" | "Unknown";
  county: LeadCounty;
  priceBand: string;
  timeframe: string;
  marketable: boolean;
  confidence: "high" | "medium" | "low";
  signals: string[];
};

const ZIP_TO_COUNTY: Record<string, LeadCounty> = {
  // Philadelphia
  "19102":"Philadelphia","19103":"Philadelphia","19104":"Philadelphia","19106":"Philadelphia","19107":"Philadelphia","19111":"Philadelphia","19114":"Philadelphia","19115":"Philadelphia","19116":"Philadelphia","19118":"Philadelphia","19119":"Philadelphia","19120":"Philadelphia","19121":"Philadelphia","19122":"Philadelphia","19123":"Philadelphia","19124":"Philadelphia","19125":"Philadelphia","19126":"Philadelphia","19127":"Philadelphia","19128":"Philadelphia","19129":"Philadelphia","19130":"Philadelphia","19131":"Philadelphia","19132":"Philadelphia","19133":"Philadelphia","19134":"Philadelphia","19135":"Philadelphia","19136":"Philadelphia","19137":"Philadelphia","19138":"Philadelphia","19139":"Philadelphia","19140":"Philadelphia","19141":"Philadelphia","19142":"Philadelphia","19143":"Philadelphia","19144":"Philadelphia","19145":"Philadelphia","19146":"Philadelphia","19147":"Philadelphia","19148":"Philadelphia","19149":"Philadelphia","19150":"Philadelphia","19151":"Philadelphia","19152":"Philadelphia","19153":"Philadelphia","19154":"Philadelphia",
  // Montgomery
  "19001":"Montgomery","19002":"Montgomery","19003":"Montgomery","19004":"Montgomery","19006":"Montgomery","19009":"Montgomery","19010":"Montgomery","19012":"Montgomery","19027":"Montgomery","19031":"Montgomery","19034":"Montgomery","19035":"Montgomery","19038":"Montgomery","19040":"Montgomery","19044":"Montgomery","19046":"Montgomery","19072":"Montgomery","19075":"Montgomery","19090":"Montgomery","19095":"Montgomery","19401":"Montgomery","19403":"Montgomery","19406":"Montgomery","19422":"Montgomery","19426":"Montgomery","19428":"Montgomery","19436":"Montgomery","19437":"Montgomery","19438":"Montgomery","19440":"Montgomery","19444":"Montgomery","19446":"Montgomery","19454":"Montgomery","19460":"Chester","19462":"Montgomery","19464":"Montgomery","19468":"Montgomery","19473":"Montgomery","19477":"Montgomery",
  // Bucks
  "18901":"Bucks","18902":"Bucks","18914":"Bucks","18923":"Bucks","18925":"Bucks","18929":"Bucks","18932":"Bucks","18938":"Bucks","18940":"Bucks","18944":"Bucks","18947":"Bucks","18951":"Bucks","18954":"Bucks","18966":"Bucks","18969":"Bucks","18972":"Bucks","18974":"Bucks","18976":"Bucks","18977":"Bucks","19007":"Bucks","19020":"Bucks","19021":"Bucks","19030":"Bucks","19047":"Bucks","19053":"Bucks","19054":"Bucks","19055":"Bucks","19056":"Bucks","19057":"Bucks","19067":"Bucks",
  // Delaware
  "19008":"Delaware","19013":"Delaware","19014":"Delaware","19015":"Delaware","19017":"Delaware","19018":"Delaware","19023":"Delaware","19026":"Delaware","19029":"Delaware","19032":"Delaware","19033":"Delaware","19036":"Delaware","19039":"Delaware","19041":"Delaware","19050":"Delaware","19060":"Delaware","19061":"Delaware","19063":"Delaware","19064":"Delaware","19070":"Delaware","19073":"Delaware","19074":"Delaware","19076":"Delaware","19078":"Delaware","19079":"Delaware","19081":"Delaware","19082":"Delaware","19083":"Delaware","19085":"Delaware","19086":"Delaware","19087":"Delaware","19094":"Delaware","19096":"Delaware",
  // Chester
  "19301":"Chester","19310":"Chester","19311":"Chester","19312":"Chester","19317":"Chester","19319":"Chester","19320":"Chester","19330":"Chester","19333":"Chester","19335":"Chester","19341":"Chester","19342":"Chester","19343":"Chester","19344":"Chester","19348":"Chester","19355":"Chester","19363":"Chester","19365":"Chester","19372":"Chester","19380":"Chester","19382":"Chester","19390":"Chester","19425":"Chester","19460":"Chester","19475":"Chester"
};

const CITY_TO_COUNTY: Record<string, LeadCounty> = {
  philadelphia:"Philadelphia",
  abington:"Montgomery", glenside:"Montgomery", wyncote:"Montgomery", oreland:"Montgomery", dresher:"Montgomery", horsham:"Montgomery", jenkintown:"Montgomery", lansdale:"Montgomery", "lower gwynedd":"Montgomery", "upper gwynedd":"Montgomery", "maple glen":"Montgomery", "plymouth meeting":"Montgomery", "willow grove":"Montgomery", "huntingdon valley":"Montgomery",
  doylestown:"Bucks", warminster:"Bucks", bensalem:"Bucks", yardley:"Bucks", newtown:"Bucks", ivyland:"Bucks", perkasie:"Bucks", warrington:"Bucks", southampton:"Bucks", churchville:"Bucks", quakertown:"Bucks", richboro:"Bucks", langhorne:"Bucks", levittown:"Bucks", holland:"Bucks", chalfont:"Bucks",
  media:"Delaware", springfield:"Delaware", havertown:"Delaware", drexelhill:"Delaware", "drexel hill":"Delaware", swarthmore:"Delaware", aston:"Delaware", broomall:"Delaware",
  westchester:"Chester", "west chester":"Chester", downingtown:"Chester", exton:"Chester", malvern:"Chester", phoenixville:"Chester", kennettsquare:"Chester", "kennett square":"Chester"
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function countyFromProperty(property: Record<string, unknown>): LeadCounty {
  const zip = asString(property.code || property.zip || property.zipcode);
  if (zip && ZIP_TO_COUNTY[zip]) return ZIP_TO_COUNTY[zip];
  const city = asString(property.city).toLowerCase();
  if (city && CITY_TO_COUNTY[city]) return CITY_TO_COUNTY[city];
  const state = asString(property.state).toUpperCase();
  return state && state !== "PA" ? "Other" : "Unknown";
}

function priceBand(value: number | undefined) {
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

  const audience: LeadClassification["audience"] =
    asString(raw.type).toLowerCase() === "seller" || lowerTags.includes("seller") ? "Seller" :
    asString(raw.type).toLowerCase() === "buyer" || lowerTags.includes("buyer") ? "Buyer" : "Unknown";

  const blocked = lowerTags.some((t)=>
    t.includes("dnc") || t.includes("unsub") || t.includes("do_not_contact") || t.includes("do not contact")
  );

  const signals: string[] = [];
  const countyVotes: Record<LeadCounty, number> = {Philadelphia:0,Montgomery:0,Bucks:0,Delaware:0,Chester:0,Other:0,Unknown:0};
  const eventPrices: number[] = [];

  if (typeof raw.id === "number" || typeof raw.id === "string") {
    try {
      const result = await fubGet<EventsResponse>(`/events?limit=50&personId=${encodeURIComponent(String(raw.id))}&type=${encodeURIComponent("Property Inquiry,Viewed Property,Saved Property")}`);
      for (const event of result.events ?? []) {
        const property = event.property;
        if (!property || typeof property !== "object" || Array.isArray(property)) continue;
        const p = property as Record<string, unknown>;
        const county = countyFromProperty(p);
        countyVotes[county] += 1;
        const price = Number(p.price);
        if (Number.isFinite(price) && price > 0) eventPrices.push(price);
      }
      const usefulEvents = Object.entries(countyVotes).reduce((sum,[k,v])=>k === "Unknown" ? sum : sum + v,0);
      if (usefulEvents) signals.push(`${usefulEvents} location-tagged property events`);
    } catch {
      signals.push("property events unavailable");
    }
  }

  let county: LeadCounty = "Unknown";
  const ranked = Object.entries(countyVotes)
    .filter(([k])=>k !== "Unknown")
    .sort((a,b)=>b[1]-a[1]) as Array<[LeadCounty, number]>;
  if (ranked[0]?.[1]) county = ranked[0][0];

  if (county === "Unknown") {
    const addresses = raw.addresses;
    if (Array.isArray(addresses)) {
      for (const address of addresses) {
        if (!address || typeof address !== "object") continue;
        const a = address as Record<string, unknown>;
        const fromAddress = countyFromProperty({code:a.code, city:a.city, state:a.state});
        if (fromAddress !== "Unknown") { county = fromAddress; signals.push("contact address fallback"); break; }
      }
    }
  }

  const personPrice = Number(raw.price);
  const chosenPrice = median(eventPrices) ?? (Number.isFinite(personPrice) && personPrice > 0 ? personPrice : undefined);
  if (eventPrices.length) signals.push(`${eventPrices.length} property prices used`);
  else if (chosenPrice) signals.push("FUB lead price used");

  const timeframe = asString(raw.timeframeStatus) || "Unknown";
  if (timeframe !== "Unknown") signals.push(`timeframe: ${timeframe}`);

  const topVote = ranked[0]?.[1] ?? 0;
  const secondVote = ranked[1]?.[1] ?? 0;
  const confidence: LeadClassification["confidence"] =
    county !== "Unknown" && topVote >= 3 && topVote >= secondVote * 2 ? "high" :
    county !== "Unknown" ? "medium" : "low";

  return {
    audience,
    county,
    priceBand: priceBand(chosenPrice),
    timeframe,
    marketable: !blocked,
    confidence,
    signals,
  };
}
