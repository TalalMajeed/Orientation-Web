import { cookies } from "next/headers";

import {
  SESSION_COOKIE_NAME,
  hasRole,
  verifySessionToken,
} from "@/services/auth/session";
import AccessNotice from "@/components/tickets/AccessNotice";
import Scanner from "@/components/tickets/Scanner";
import SocialsLogin from "@/components/socials/SocialsLogin";

// Self-gating: shows the Socials sign-in until a scanner (or admin) session
// exists, then swaps in the camera scanner. Not in proxy's guard list so it
// can render its own login instead of bouncing to the staff login.
export default async function SocialsPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (hasRole(session, "scanner", "admin")) {
    return (
      <>
        <AccessNotice />
        <Scanner />
      </>
    );
  }

  return <SocialsLogin />;
}
