import { NextResponse } from "next/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (typeof email !== "string" || !emailPattern.test(email.trim())) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    const normalized = email.trim().toLowerCase();

    // Integration point: connect this function to Brevo, Mailchimp, ConvertKit, etc.
    // Keep provider credentials server-side in Vercel Environment Variables.
    if (process.env.NEWSLETTER_PROVIDER_URL && process.env.NEWSLETTER_API_KEY) {
      const response = await fetch(process.env.NEWSLETTER_PROVIDER_URL, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${process.env.NEWSLETTER_API_KEY}` }, body: JSON.stringify({ email: normalized }) });
      if (!response.ok) return NextResponse.json({ error: "Newsletter service rejected the signup." }, { status: 502 });
    } else {
      console.info("Newsletter integration not configured", normalized);
    }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
}
