const pending = [
  { id: "1023", subject: "Can't register for orientation course", requester: "Sam Lee" },
  { id: "1020", subject: "Need accessibility accommodation", requester: "Priya Nair" },
  { id: "1018", subject: "Refund request for orientation fee", requester: "Marcus Wright" },
];

export default function ApproveTicketsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">Support Desk</p>
      <h1 className="mt-3 font-serif text-4xl font-bold text-fg sm:text-5xl">Approve Tickets</h1>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">
        {pending.length} tickets awaiting approval
      </p>

      <div className="mt-8 space-y-3">
        {pending.map((t) => (
          <div
            key={t.id}
            className="flex flex-col gap-4 rounded-2xl border border-fg/12 p-5 transition-colors hover:border-fg/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="font-sans text-base font-medium text-fg">{t.subject}</div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-fg/50">
                #{t.id} · {t.requester}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="rounded-full border-2 border-dotted border-fg/40 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fg transition-colors hover:border-fg">
                Reject
              </button>
              <button className="rounded-full bg-ember px-5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-cream transition hover:brightness-110">
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
