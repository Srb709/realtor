import { NextRequest, NextResponse } from "next/server";
import { marketContent } from "../../../../content/marketContent";
import { generateMarketDraft, previewMarketPrompt } from "../../../../lib/contentGenerator";

export const dynamic = "force-dynamic";

function getItem(slug: string | null) {
  return marketContent.find((item) => item.slug === slug);
}

function authorized(request: NextRequest) {
  const configured = process.env.CONTENT_ADMIN_TOKEN;
  if (!configured) return false;
  const supplied = request.headers.get("x-admin-token");
  return Boolean(supplied && supplied === configured);
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const item = getItem(slug);
  if (!item) {
    return NextResponse.json({ error: "Unknown content slug" }, { status: 404 });
  }

  return NextResponse.json({
    slug: item.slug,
    title: item.title,
    county: item.county,
    audience: item.audience,
    prompt: previewMarketPrompt(item),
    generationReady: Boolean(process.env.OPENAI_API_KEY && process.env.CONTENT_ADMIN_TOKEN),
    note: "GET only previews the generation instructions and never calls OpenAI."
  });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const slug = typeof body?.slug === "string" ? body.slug : null;
  const item = getItem(slug);
  if (!item) {
    return NextResponse.json({ error: "Unknown content slug" }, { status: 404 });
  }

  try {
    const draft = await generateMarketDraft(item);
    return NextResponse.json({
      ...draft,
      status: "DRAFT_ONLY",
      warning: "Human review required before publishing or emailing."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
