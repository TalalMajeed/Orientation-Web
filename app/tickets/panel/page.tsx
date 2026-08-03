const stats = [
  { label: "Open Tickets", value: 12 },
  { label: "Pending Approval", value: 3 },
  { label: "Resolved This Week", value: 27 },
  { label: "Active Users", value: 184 },
];

export default function AdminPanelPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">Support Desk</p>
      <h1 className="mt-3 font-serif text-4xl font-bold text-fg sm:text-5xl">Admin Panel</h1>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">
        Overview of the ticketing system
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-fg/12 bg-fg/[0.02] p-5">
            <div className="text-4xl font-bold tabular-nums text-fg">{s.value}</div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-fg/50">
              {s.label}
            </div>
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
            className="rounded-2xl border border-fg/12 p-5 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-fg transition-colors hover:border-fg/40 hover:bg-fg/[0.03]"
          >
            {action.label}
          </a>
        ))}
      </div>
    </main>
  );
}
