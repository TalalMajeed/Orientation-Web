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
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Ticket System</h1>
      <p className="mt-4 text-neutral-600">
        Submit and track support requests during orientation week.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border border-neutral-200 p-5 transition hover:border-neutral-400 hover:bg-neutral-50"
          >
            <div className="font-medium">{link.label}</div>
            <div className="mt-1 text-sm text-neutral-500">{link.desc}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
