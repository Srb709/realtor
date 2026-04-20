import { NextResponse } from "next/server";
import { Resend } from "resend";

const recipient = "steven@themcknightteam.com";
const sender = "onboarding@resend.dev";

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ message: "Server is missing RESEND_API_KEY." }, { status: 500 });
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const phone = clean(body.phone);
  const timeline = clean(body.timeline);
  const message = clean(body.message);

  if (!name || !email || !timeline || !message) {
    return NextResponse.json({ message: "Please fill out all required fields." }, { status: 400 });
  }

  if (!validEmail(email)) {
    return NextResponse.json({ message: "Please use a valid email." }, { status: 400 });
  }

  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: sender,
      to: recipient,
      replyTo: email,
      subject: `New PA Homebuyer Lead: ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || "Not provided"}`,
        `Timeline: ${timeline}`,
        "",
        "Message:",
        message
      ].join("\n")
    });

    return NextResponse.json({ message: "Lead sent." }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Could not send message right now. Please try again." }, { status: 502 });
  }
}
