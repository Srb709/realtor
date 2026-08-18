import type { MarketContent } from "./contentMatcher";

export type GeneratedMarketDraft = {
  slug: string;
  title: string;
  generatedAt: string;
  model: string;
  content: string;
};

function buildPrompt(item: MarketContent) {
  const county = item.county === "All" ? "Southeastern Pennsylvania" : `${item.county} County, Pennsylvania`;
  const audience = item.audience === "All" ? "real-estate consumers" : `${item.audience.toLowerCase()}s`;

  return [
    `Create Steven Brooks' weekly real-estate intelligence draft for ${county}, aimed at ${audience}.`,
    "Use current web research and prefer primary/authoritative sources when possible (county/government, Federal Reserve, Census, Realtor association/MLS public releases, lender/mortgage sources).",
    "Do not invent MLS statistics. If a useful metric cannot be verified publicly, say so and use a different verified fact.",
    "The voice should be concise, practical, local, conversational, and useful — not generic Realtor newsletter fluff.",
    "Explain what the facts mean for an actual buyer or seller. Avoid hype, fake certainty, and salesy filler.",
    "Do not give legal, tax, lending, or inspection advice as a certainty; flag when a professional should confirm something.",
    "Include source links in the article draft so Steven can verify every time-sensitive factual claim before publishing.",
    "Return Markdown in exactly this structure:",
    "# ARTICLE",
    "## [strong specific headline]",
    "[700-1100 word article]",
    "### What I’d do",
    "[2-4 sentence practical Steven-style takeaway]",
    "### Sources",
    "[bulleted source links with source names]",
    "# EMAIL",
    "Subject: [short subject line]",
    "Preview: [short preview text]",
    "[120-220 word email that teases the useful points and links readers to the full article using {{ARTICLE_URL}}]",
    "Close with: Steven Brooks | REALTOR® | Keller Williams",
    `Internal content slug: ${item.slug}`,
  ].join("\n\n");
}

function extractOutputText(response: any): string {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const pieces: string[] = [];
  for (const item of response?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const part of item?.content ?? []) {
      if (part?.type === "output_text" && typeof part.text === "string") pieces.push(part.text);
    }
  }
  return pieces.join("\n").trim();
}

export async function generateMarketDraft(item: MarketContent): Promise<GeneratedMarketDraft> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const model = process.env.OPENAI_CONTENT_MODEL || "gpt-5.6-terra";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      tools: [{ type: "web_search" }],
      input: buildPrompt(item),
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI generation failed (${response.status}): ${details.slice(0, 300)}`);
  }

  const json = await response.json();
  const content = extractOutputText(json);
  if (!content) throw new Error("OpenAI returned no draft text");

  return {
    slug: item.slug,
    title: item.title,
    generatedAt: new Date().toISOString(),
    model,
    content,
  };
}

export function previewMarketPrompt(item: MarketContent) {
  return buildPrompt(item);
}
