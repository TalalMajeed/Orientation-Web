import { NextRequest, NextResponse } from "next/server";

import { readJson } from "@/lib/request";
import { requireRole } from "@/services/auth/guard";
import {
  AccountValidationError,
  createAccount,
  listAccounts,
} from "@/services/auth/accounts";

const MANAGER_ROLES = ["liaison"] as const;

function accountError(error: unknown) {
  if (error instanceof AccountValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  throw error;
}

export async function GET(request: NextRequest) {
  const denied = requireRole(request, ...MANAGER_ROLES);

  if (denied) {
    return denied;
  }

  return NextResponse.json({ accounts: await listAccounts() }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const denied = requireRole(request, ...MANAGER_ROLES);

  if (denied) {
    return denied;
  }

  const body = await readJson(request);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const account = await createAccount(body.username, body.password);

    return NextResponse.json({ account, accounts: await listAccounts() }, { status: 201 });
  } catch (error) {
    return accountError(error);
  }
}
