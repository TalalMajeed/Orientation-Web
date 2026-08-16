import { NextRequest, NextResponse } from "next/server";

import { readJson, readString } from "@/lib/request";
import { requireRole } from "@/services/auth/guard";
import {
  addNewsletterSubscriber,
  listNewsletterSubscribers,
  removeNewsletterSubscriber,
} from "@/services/newsletter/subscribe";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL = 200;

export async function GET(request: NextRequest) {
  const denied = requireRole(request, "admin");

  if (denied) {
    return denied;
  }

  const subscribers = await listNewsletterSubscribers();

  return NextResponse.json({ subscribers, count: subscribers.length }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const body = await readJson(request);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = readString(body, "email").toLowerCase();

  if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const { alreadySubscribed } = await addNewsletterSubscriber(email);

  if (alreadySubscribed) {
    return NextResponse.json({ message: "Email is already subscribed" }, { status: 200 });
  }

  return NextResponse.json({ message: "Subscribed to newsletter" }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const denied = requireRole(request, "admin");

  if (denied) {
    return denied;
  }

  const body = await readJson(request);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = readString(body, "email").toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const removed = await removeNewsletterSubscriber(email);

  if (!removed) {
    return NextResponse.json({ error: "Email is not subscribed" }, { status: 404 });
  }

  return NextResponse.json({ message: "Unsubscribed" }, { status: 200 });
}
