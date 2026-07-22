import Link from "next/link";

const tabs = [
  { href: "/event-tickets", label: "Overview" },
  { href: "/event-tickets/issue", label: "Issue" },
  { href: "/event-tickets/list", label: "Tickets" },
  { href: "/scan", label: "Scan" },
];

export default function EventTicketsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center gap-1 px-6 py-3 text-sm">
          <span className="mr-4 font-semibold tracking-tight">Event Tickets</span>
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="rounded-md px-3 py-1.5 font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
