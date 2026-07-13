import { NextRequest, NextResponse } from "next/server";

import { addNewsletterSubscriber } from "@/services/newsletter/newsletter";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawEmail =
    typeof body === "object" && body !== null && "email" in body
      ? (body as { email: unknown }).email
      : undefined;

  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 }
    );
  }

  const { alreadySubscribed } = await addNewsletterSubscriber(email);

  if (alreadySubscribed) {
    return NextResponse.json(
      { message: "Email is already subscribed" },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { message: "Subscribed to newsletter" },
    { status: 201 }
  );
}
