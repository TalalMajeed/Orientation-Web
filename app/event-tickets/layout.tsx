"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import AccessNotice from "@/components/tickets/AccessNotice";

const tabs = [
  { href: "/event-tickets", label: "Overview" },
  { href: "/event-tickets/issue", label: "Issue" },
  { href: "/event-tickets/list", label: "Tickets" },
  { href: "/socials", label: "Socials" },
];

export default function EventTicketsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface text-fg">
      {/* A ticketing admin bounced off /hr (or any page not theirs) lands here;
          without this the page they asked for just silently vanishes. */}
      <AccessNotice inline />
      <header className="sticky top-0 z-30 border-b border-fg/10 bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl font-bold text-fg">Event Tickets</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg/45">
              Orientation &apos;26
            </span>
          </div>
          <Link
            href="/admin"
            className="rounded-full border-2 border-dotted border-fg/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-fg transition-colors hover:border-fg"
          >
            Admin
          </Link>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-6 pb-3">
          {tabs.map((tab) => {
            const active =
              tab.href === "/event-tickets"
                ? pathname === "/event-tickets"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`shrink-0 rounded-full border-2 border-dotted px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                  active
                    ? "border-transparent bg-fg text-surface"
                    : "border-fg/40 text-fg hover:border-fg"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </div>
  );
}
