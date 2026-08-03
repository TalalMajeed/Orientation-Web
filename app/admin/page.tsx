import Link from "next/link";

type Portal = {
  name: string;
  desc: string;
  href: string;
  color: string;
  hint: string;
};

const PORTALS: Portal[] = [
  {
    name: "Liaison",
    desc: "OG houses, teams & batch allocation",
    href: "/liaison/login",
    color: "#D85503",
    hint: "Demo login",
  },
  {
    name: "Socials",
    desc: "Gate check-in — scan entry tickets",
    href: "/socials",
    color: "#4B8FB3",
    hint: "Scanner credentials",
  },
  {
    name: "Event Tickets",
    desc: "Issue, email & manage entry tickets",
    href: "/login",
    color: "#2A5290",
    hint: "Staff credentials",
  },
  {
    name: "Support Desk",
    desc: "Submit & track support requests",
    href: "/tickets/login",
    color: "#4FB49A",
    hint: "Student account",
  },
  {
    name: "HR",
    desc: "Create & manage short invite links",
    href: "/login?next=/hr",
    color: "#B8860B",
    hint: "Admin credentials",
  },
];

export default function AdminHub() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-surface px-6 py-16 text-fg">
      <div className="w-full max-w-3xl">
        <p className="font-italic text-sm italic text-fg/50">— NUST Orientation &apos;26</p>
        <h1 className="mt-2 font-serif text-5xl font-bold leading-none text-fg sm:text-6xl">
          Portals
        </h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-fg/50">
          Pick a portal to sign in
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {PORTALS.map((p) => (
            <Link
              key={p.name}
              href={p.href}
              className="group flex items-start gap-3 rounded-2xl border border-fg/12 p-5 transition-colors hover:border-fg/40 hover:bg-fg/[0.03]"
            >
              <span
                className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: p.color }}
              />
              <span className="min-w-0">
                <span className="flex items-baseline gap-2">
                  <span className="font-serif text-2xl font-bold text-fg">{p.name}</span>
                  <span className="font-mono text-[14px] text-fg/30 transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
                <span className="mt-1 block font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-fg/50">
                  {p.desc}
                </span>
                <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-fg/35">
                  {p.hint}
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-6 border-t border-dashed border-fg/15 pt-6">
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg/60 transition-opacity hover:opacity-60"
          >
            Website
          </Link>
          <Link
            href="/tickets"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg/60 transition-opacity hover:opacity-60"
          >
            Support Desk
          </Link>
        </div>
      </div>
    </main>
  );
}
