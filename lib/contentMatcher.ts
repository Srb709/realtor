import type { LeadClassification, LeadCounty } from "./leadClassifier";

export type ContentAudience = "Buyer" | "Seller" | "All";

export type MarketContent = {
  id: string;
  slug: string;
  title: string;
  county: LeadCounty | "All";
  audience: ContentAudience;
  priceBands?: string[];
  timeframes?: string[];
  priority?: number;
};

export type ContentMatch = {
  content: MarketContent;
  score: number;
  reasons: string[];
};

export function scoreContentForLead(
  lead: LeadClassification,
  content: MarketContent
): ContentMatch | null {
  if (!lead.marketable) return null;

  let score = 0;
  const reasons: string[] = [];

  if (content.county === lead.county && lead.county !== "Unknown") {
    score += 60;
    reasons.push("county match");
  } else if (content.county === "All") {
    score += 15;
    reasons.push("regional fallback");
  } else {
    return null;
  }

  if (content.audience === lead.audience && lead.audience !== "Unknown") {
    score += 30;
    reasons.push("audience match");
  } else if (content.audience === "All") {
    score += 10;
    reasons.push("general audience");
  } else {
    return null;
  }

  if (content.priceBands?.length) {
    if (content.priceBands.includes(lead.priceBand)) {
      score += 20;
      reasons.push("price-band match");
    } else if (lead.priceBand !== "Unknown") {
      score -= 5;
    }
  }

  if (content.timeframes?.length) {
    if (content.timeframes.includes(lead.timeframe)) {
      score += 10;
      reasons.push("timeframe match");
    }
  }

  if (lead.confidence === "high") score += 5;
  if (lead.confidence === "low") score -= 5;
  score += content.priority ?? 0;

  return { content, score, reasons };
}

export function matchBestContent(
  lead: LeadClassification,
  content: MarketContent[]
): ContentMatch | null {
  const matches = content
    .map((item) => scoreContentForLead(lead, item))
    .filter((item): item is ContentMatch => Boolean(item))
    .sort((a, b) => b.score - a.score);

  return matches[0] ?? null;
}
