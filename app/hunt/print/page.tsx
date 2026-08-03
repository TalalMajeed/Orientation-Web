import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE_NAME,
  hasRole,
  verifySessionToken,
} from "@/services/auth/session";
import HuntPrintSheet from "@/components/hunt/HuntPrintSheet";

export const metadata = { title: "Print Hunt Codes — NUST Orientation '26" };

export default async function HuntPrintPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  );

  if (!hasRole(session, "admin", "hunt")) {
    redirect("/login?next=/hunt/print");
  }

  return <HuntPrintSheet />;
}
