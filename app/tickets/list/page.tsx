const tickets = [
  { id: "1024", subject: "Missing housing assignment", status: "Open", submitted: "Jul 10" },
  { id: "1023", subject: "Can't register for orientation course", status: "Pending", submitted: "Jul 10" },
  { id: "1022", subject: "Wifi not working in dorm", status: "Resolved", submitted: "Jul 9" },
  { id: "1021", subject: "Duplicate meal plan charge", status: "Open", submitted: "Jul 8" },
  { id: "1020", subject: "Need accessibility accommodation", status: "Pending", submitted: "Jul 7" },
];

const statusStyles: Record<string, string> = {
  Open: "border border-sky/40 bg-sky/15 text-fg",
  Pending: "border border-ember/40 bg-ember/10 text-ember",
  Resolved: "border border-transparent bg-fg text-surface",
};

export default function TicketsListPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">Support Desk</p>
      <h1 className="mt-3 font-serif text-4xl font-bold text-fg sm:text-5xl">All Tickets</h1>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">
        {tickets.length} tickets total
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-fg/12">
        <table className="w-full min-w-[640px] border-collapse text-left font-mono text-[12px]">
          <thead>
            <tr className="border-b border-fg/15 text-fg/45">
              {["ID", "Subject", "Status", "Submitted"].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-[0.12em]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr
                key={t.id}
                className="border-b border-fg/8 text-fg/80 transition-colors hover:bg-fg/[0.03]"
              >
                <td className="px-4 py-3 text-fg/50">#{t.id}</td>
                <td className="px-4 py-3 font-sans font-medium text-fg">{t.subject}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] ${statusStyles[t.status]}`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-fg/60">{t.submitted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
