"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function Notice() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  const denied = searchParams.get("denied");

  // Same rule as the login page's ?next=: only same-origin relative paths, so a
  // crafted link cannot put arbitrary text on a page staff are meant to trust.
  const path =
    denied && denied.startsWith("/") && !denied.startsWith("//") ? denied : null;

  if (!path || dismissed) {
    return null;
  }

  function handleDismiss() {
    setDismissed(true);
    router.replace(pathname);
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-amber-300 bg-amber-50 px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-start justify-between gap-4">
        <p className="text-sm text-amber-900">
          <span className="font-mono">{path}</span> needs admin access. You are
          signed in as a scanner, so we brought you here instead.
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

/**
 * proxy.ts and the login page redirect staff to their own landing page when
 * their role cannot open the page they asked for. Without this they just
 * appear somewhere unexpected with no reason given, which reads as a dead link.
 *
 * Fixed rather than inline: the scanner setup screen is a vertically centred
 * min-h-screen panel, and pushing it down would put it half off a phone.
 */
export default function AccessNotice() {
  return (
    <Suspense>
      <Notice />
    </Suspense>
  );
}
