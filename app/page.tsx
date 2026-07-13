import Link from "next/link";

const quickLinks = [
  { href: "/plan", label: "Orientation Plan", desc: "See the full week schedule" },
  { href: "/gallery", label: "Gallery", desc: "Photos from campus life" },
  { href: "/tickets", label: "Support Tickets", desc: "Get help during orientation" },
  { href: "/about", label: "About", desc: "Learn about the program" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-tight">NUST Orientation</span>
        <div className="flex gap-6 text-sm text-neutral-600">
          <Link href="/about" className="hover:text-neutral-900">About</Link>
          <Link href="/plan" className="hover:text-neutral-900">Plan</Link>
          <Link href="/gallery" className="hover:text-neutral-900">Gallery</Link>
          <Link href="/contact" className="hover:text-neutral-900">Contact</Link>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-sm font-medium text-neutral-500">National University of Sciences &amp; Technology</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Welcome to NUST Orientation
        </h1>
        <p className="mt-4 text-neutral-600">
          Everything incoming students need for orientation week — schedules,
          campus tours, registration help, and support — all in one place.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/plan"
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            View Orientation Plan
          </Link>
          <Link
            href="/tickets"
            className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50"
          >
            Get Support
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-neutral-200 p-5 transition hover:border-neutral-400 hover:bg-neutral-50"
            >
              <div className="font-medium">{link.label}</div>
              <div className="mt-1 text-sm text-neutral-500">{link.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-neutral-500 sm:flex-row">
          <span>© 2026 NUST Orientation</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-neutral-900">Privacy</Link>
            <Link href="/terms" className="hover:text-neutral-900">Terms</Link>
            <Link href="/contact" className="hover:text-neutral-900">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
