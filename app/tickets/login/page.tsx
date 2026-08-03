export default function TicketsLoginPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-surface px-6 py-16 text-fg">
      <div className="w-full max-w-sm">
        <p className="font-italic text-sm italic text-fg/50">— NUST Orientation &apos;26</p>
        <h1 className="mt-2 font-serif text-5xl font-bold leading-none text-fg sm:text-6xl">
          Support Desk
        </h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg/50">
          Access the ticketing system with your student account
        </p>

        <form className="mt-8 space-y-3">
          <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-fg/60">
            Email
            <input
              type="email"
              placeholder="jane@university.edu"
              className="mt-2 w-full rounded-full border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] normal-case tracking-normal text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none"
            />
          </label>
          <label className="block font-mono text-[11px] uppercase tracking-[0.14em] text-fg/60">
            Password
            <input
              type="password"
              placeholder="••••••••"
              className="mt-2 w-full rounded-full border-2 border-dotted border-fg/25 bg-transparent px-5 py-3 font-mono text-[13px] normal-case tracking-normal text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none"
            />
          </label>

          <button
            type="button"
            className="w-full rounded-full bg-ember px-6 py-3 font-mono text-[12px] uppercase tracking-[0.16em] text-cream transition hover:brightness-110"
          >
            Sign In
          </button>
        </form>

        <a
          href="/admin"
          className="mt-8 block text-center font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50 transition-opacity hover:opacity-60"
        >
          ← All portals
        </a>
      </div>
    </main>
  );
}
