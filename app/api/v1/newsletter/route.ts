import { NextRequest, NextResponse } from "next/server";

import { readJson, readString } from "@/lib/request";
import { addNewsletterSubscriber } from "@/services/newsletter/subscribe";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await readJson(request);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = readString(body, "email").toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const { alreadySubscribed } = await addNewsletterSubscriber(email);

  if (alreadySubscribed) {
    return NextResponse.json({ message: "Email is already subscribed" }, { status: 200 });
  }

  return NextResponse.json({ message: "Subscribed to newsletter" }, { status: 201 });
}
