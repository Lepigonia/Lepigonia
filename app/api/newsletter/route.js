import { NextResponse } from "next/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (typeof email !== "string" || !emailPattern.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    if (!process.env.NEWSLETTER_PROVIDER_URL || !process.env.NEWSLETTER_API_KEY) {
      return NextResponse.json({ error: "Newsletter service is not configured." }, { status: 503 });
    }

    const response = await fetch(process.env.NEWSLETTER_PROVIDER_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.NEWSLETTER_API_KEY}`,
      },
      body: JSON.stringify({ email: normalized }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Newsletter service rejected the signup." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
