import Link from "next/link";

const links = [
  { href: "/tickets/list", label: "All Tickets", desc: "Browse every submitted ticket" },
  { href: "/tickets/issue", label: "Issue Ticket", desc: "Submit a new support request" },
  { href: "/tickets/approve", label: "Approve Tickets", desc: "Review pending approvals" },
  { href: "/tickets/panel", label: "Admin Panel", desc: "Manage the ticketing system" },
  { href: "/tickets/users", label: "Users", desc: "View registered users" },
  { href: "/tickets/login", label: "Login", desc: "Sign in to your account" },
];

export default function TicketsHomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">
        Orientation &apos;26 · Support Desk
      </p>
      <h1 className="mt-3 font-serif text-4xl font-bold text-fg sm:text-5xl">Ticket System</h1>
      <p className="mt-4 max-w-xl text-fg/60">
        Submit and track support requests during orientation week.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-fg/12 p-6 transition-colors hover:border-fg/40 hover:bg-fg/[0.03]"
          >
            <div className="font-serif text-2xl font-bold text-fg">{link.label}</div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-fg/50">
              {link.desc}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
