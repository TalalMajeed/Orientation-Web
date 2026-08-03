"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function Notice({ inline }: { inline: boolean }) {
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
    <div
      className={`${
        inline ? "relative" : "fixed inset-x-0 top-0 z-50"
      } border-b border-dashed border-ember/40 bg-ember/[0.06] px-4 py-3`}
    >
      <div className="mx-auto flex max-w-3xl items-start justify-between gap-4">
        <p className="font-mono text-[12px] text-fg">
          <span className="text-ember">{path}</span> is not open to your account,
          so we brought you here instead.
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-fg/60 transition-colors hover:text-ember"
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
 * Fixed by default: the scanner setup screen is a vertically centred
 * min-h-screen panel, and pushing it down would put it half off a phone. Pass
 * `inline` on pages that flow from the top, where an overlay would sit on top
 * of the nav instead of above it.
 */
export default function AccessNotice({ inline = false }: { inline?: boolean }) {
  return (
    <Suspense>
      <Notice inline={inline} />
    </Suspense>
  );
}
