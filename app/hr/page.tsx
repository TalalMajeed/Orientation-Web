import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/services/hr/session";
import Manager from "@/components/hr/manager";

export default async function HrPage() {
  const cookieStore = await cookies();
  const isAuthenticated = verifySessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  );

  if (!isAuthenticated) {
    redirect("/hr/login");
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Manager />
    </main>
  );
}
