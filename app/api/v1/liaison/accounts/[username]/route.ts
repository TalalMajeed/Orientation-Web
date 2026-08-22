import { NextRequest, NextResponse } from "next/server";

import { readJson } from "@/lib/request";
import { requireRole } from "@/services/auth/guard";
import {
  AccountValidationError,
  deleteAccount,
  listAccounts,
  setAccountPassword,
} from "@/services/auth/accounts";

const MANAGER_ROLES = ["liaison"] as const;

type RouteContext = { params: Promise<{ username: string }> };

function accountError(error: unknown) {
  if (error instanceof AccountValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  throw error;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const denied = requireRole(request, ...MANAGER_ROLES);

  if (denied) {
    return denied;
  }

  const { username } = await params;
  const body = await readJson(request);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const account = await setAccountPassword(decodeURIComponent(username), body.password);

    return NextResponse.json({ account, accounts: await listAccounts() }, { status: 200 });
  } catch (error) {
    return accountError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const denied = requireRole(request, ...MANAGER_ROLES);

  if (denied) {
    return denied;
  }

  const { username } = await params;

  try {
    await deleteAccount(decodeURIComponent(username));

    return NextResponse.json({ accounts: await listAccounts() }, { status: 200 });
  } catch (error) {
    return accountError(error);
  }
}
