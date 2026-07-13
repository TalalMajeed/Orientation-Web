const stats = [
  { label: "Open Tickets", value: 12 },
  { label: "Pending Approval", value: 3 },
  { label: "Resolved This Week", value: 27 },
  { label: "Active Users", value: 184 },
];

export default function AdminPanelPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
      <p className="mt-2 text-sm text-neutral-500">Overview of the ticketing system</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-neutral-200 p-5">
            <div className="text-2xl font-semibold">{s.value}</div>
            <div className="mt-1 text-sm text-neutral-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Review Tickets", href: "/tickets/list" },
          { label: "Approve Requests", href: "/tickets/approve" },
          { label: "Manage Users", href: "/tickets/users" },
        ].map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="rounded-lg border border-neutral-200 p-4 text-center text-sm font-medium hover:bg-neutral-50"
          >
            {action.label}
          </a>
        ))}
      </div>
    </main>
  );
}
