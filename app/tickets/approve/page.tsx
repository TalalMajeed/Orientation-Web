const pending = [
  { id: "1023", subject: "Can't register for orientation course", requester: "Sam Lee" },
  { id: "1020", subject: "Need accessibility accommodation", requester: "Priya Nair" },
  { id: "1018", subject: "Refund request for orientation fee", requester: "Marcus Wright" },
];

export default function ApproveTicketsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Approve Tickets</h1>
      <p className="mt-2 text-sm text-neutral-500">
        {pending.length} tickets awaiting approval
      </p>

      <div className="mt-8 space-y-3">
        {pending.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 p-4"
          >
            <div>
              <div className="font-medium">{t.subject}</div>
              <div className="text-sm text-neutral-500">
                #{t.id} · {t.requester}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50">
                Reject
              </button>
              <button className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700">
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
