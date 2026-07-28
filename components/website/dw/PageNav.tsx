import Link from "next/link";

const links = [
  { href: "/schedule", label: "Schedule" },
  { href: "/map", label: "Map" },
  { href: "/event-tickets", label: "Tickets" },
  { href: "/contact", label: "Contact" },
];

export default function PageNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-fg/10 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 sm:px-10">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="NUST Orientation" className="h-9 w-auto sm:h-10" />
          <span className="hidden font-serif text-xl font-bold text-fg sm:inline">
            ON&apos;26
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border-2 border-dotted border-fg/40 px-3 py-1.5 font-italic text-[11px] italic text-fg transition-colors hover:border-transparent hover:bg-fg hover:text-surface sm:px-4 sm:text-sm"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
