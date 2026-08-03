export default function IssueTicketPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">Support Desk</p>
      <h1 className="mt-3 font-serif text-4xl font-bold text-fg sm:text-5xl">Issue a Ticket</h1>
      <p className="mt-4 max-w-xl text-fg/60">
        Submit a new support request to the orientation team.
      </p>

      <form className="mt-8 space-y-5">
        <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-fg/60">
          Subject
          <input
            type="text"
            placeholder="Missing housing assignment"
            className="mt-2 w-full rounded-full border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] normal-case tracking-normal text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none"
          />
        </label>

        <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-fg/60">
          Category
          <div className="relative mt-2 block">
            <select className="w-full appearance-none rounded-full border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 pr-10 font-mono text-[13px] normal-case tracking-normal text-fg focus:border-fg focus:outline-none">
              <option>Housing</option>
              <option>Registration</option>
              <option>IT Support</option>
              <option>General</option>
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg/40"
            >
              <path
                d="M5 7.5 10 12.5 15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </label>

        <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-fg/60">
          Description
          <textarea
            rows={5}
            placeholder="Describe your issue..."
            className="mt-2 w-full rounded-2xl border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] normal-case tracking-normal text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none"
          />
        </label>

        <button
          type="button"
          className="w-full rounded-full bg-ember px-6 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-cream transition hover:brightness-110"
        >
          Submit Ticket
        </button>
      </form>
    </main>
  );
}
