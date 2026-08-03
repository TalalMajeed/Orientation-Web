export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">Ticket #{id}</p>
      <h1 className="mt-3 font-serif text-4xl font-bold text-fg sm:text-5xl">
        Missing housing assignment
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-fg/50">
        <span className="rounded-full border border-sky/40 bg-sky/15 px-2.5 py-1 text-[10px] text-fg">
          Open
        </span>
        <span>Submitted by Jane Doe</span>
        <span>·</span>
        <span>Jul 10</span>
      </div>

      <p className="mt-6 leading-relaxed text-fg/70">
        Placeholder ticket description. This is where the full request
        details submitted by the student would appear, along with any
        attachments or context provided.
      </p>

      <section className="mt-10">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">Activity</h2>
        <div className="mt-4 space-y-4 border-l border-fg/15 pl-5">
          <div>
            <div className="font-sans text-sm font-medium text-fg">Ticket created</div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-fg/40">
              Jul 10, 9:02 AM
            </div>
          </div>
          <div>
            <div className="font-sans text-sm font-medium text-fg">Assigned to Housing Team</div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-fg/40">
              Jul 10, 9:15 AM
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-2">
        <button className="rounded-full border-2 border-dotted border-fg/40 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-fg transition-colors hover:border-fg">
          Reply
        </button>
        <button className="rounded-full bg-ember px-6 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-cream transition hover:brightness-110">
          Mark Resolved
        </button>
      </div>
    </main>
  );
}
