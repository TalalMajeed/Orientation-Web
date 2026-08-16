import { NextRequest, NextResponse } from "next/server";

import { readJson, readString } from "@/lib/request";
import {
  ContactValidationError,
  sendContactMessage,
} from "@/services/contact/message";
import { isTransientMailError } from "@/services/email/graph";

export async function POST(request: NextRequest) {
  const body = await readJson(request);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    await sendContactMessage({
      name: readString(body, "name"),
      email: readString(body, "email"),
      message: readString(body, "message"),
    });
  } catch (error) {
    if (error instanceof ContactValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Contact form send failed:", error);

    if (isTransientMailError(error)) {
      return NextResponse.json(
        { error: "Mail service is busy. Please try again in a moment." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Could not send your message. Please email support directly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ message: "Message sent — we'll get back to you." }, { status: 201 });
}
