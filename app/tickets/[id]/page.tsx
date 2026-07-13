export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-sm text-neutral-500">Ticket #{id}</div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        Missing housing assignment
      </h1>

      <div className="mt-4 flex items-center gap-3 text-sm text-neutral-500">
        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
          Open
        </span>
        <span>Submitted by Jane Doe</span>
        <span>·</span>
        <span>Jul 10</span>
      </div>

      <p className="mt-6 text-neutral-600">
        Placeholder ticket description. This is where the full request
        details submitted by the student would appear, along with any
        attachments or context provided.
      </p>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-neutral-700">Activity</h2>
        <div className="mt-3 space-y-3 border-l border-neutral-200 pl-4">
          <div>
            <div className="text-sm font-medium">Ticket created</div>
            <div className="text-xs text-neutral-500">Jul 10, 9:02 AM</div>
          </div>
          <div>
            <div className="text-sm font-medium">Assigned to Housing Team</div>
            <div className="text-xs text-neutral-500">Jul 10, 9:15 AM</div>
          </div>
        </div>
      </section>

      <div className="mt-10 flex gap-2">
        <button className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50">
          Reply
        </button>
        <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
          Mark Resolved
        </button>
      </div>
    </main>
  );
}
