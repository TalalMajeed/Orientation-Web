const details = [
  { label: "General", value: "info@nustorientation.pk", href: "mailto:info@nustorientation.pk" },
  { label: "Support", value: "support@nustorientation.pk", href: "mailto:support@nustorientation.pk" },
  { label: "Location", value: "NUST, H-12, Islamabad", href: null },
  { label: "Hours", value: "Mon–Sat · 9am – 6pm PKT", href: null },
];

const socials = [
  { label: "Instagram", href: "#" },
  { label: "Facebook", href: "#" },
  { label: "YouTube", href: "#" },
  { label: "LinkedIn", href: "#" },
];

export default function ContactBlock() {
  return (
    <section className="bg-surface px-6 pb-16 pt-24 sm:px-10 sm:pt-32">
      <div className="mx-auto max-w-[1200px]">
        <p className="font-italic text-sm italic text-fg/50">— Contact</p>
        <h1 className="mt-4 font-serif font-bold text-[16vw] leading-[0.85] text-fg lg:text-[7vw]">
          Say hello
        </h1>
        <p className="mt-6 max-w-xl font-serif text-2xl leading-[1.3] text-fg sm:text-3xl">
          Questions about Orientation Week, tickets, or your house? The
          organizing team is one message away.
        </p>

        {/* Primary action up front, sized for an easy tap on any device. */}
        <a
          href="mailto:info@nustorientation.pk"
          className="mt-8 inline-block w-full rounded-full border-2 border-dotted border-transparent bg-ember px-8 py-4 text-center font-italic text-base italic text-cream transition hover:brightness-110 sm:w-auto"
        >
          Email the team →
        </a>

        {/* Contact details as plain, separated cards — clearer to scan than a
            bare label/value grid, and each one is its own tap target. */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {details.map((d) => (
            <div key={d.label} className="rounded-2xl border border-fg/12 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/45">
                {d.label}
              </p>
              {d.href ? (
                <a
                  href={d.href}
                  className="link-sweep mt-2 block font-serif text-lg text-fg"
                >
                  {d.value}
                </a>
              ) : (
                <p className="mt-2 font-serif text-lg text-fg">{d.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/45">
            Follow along
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="rounded-full border-2 border-dotted border-fg/40 px-5 py-2 font-italic text-sm italic text-fg transition-colors hover:border-transparent hover:bg-fg hover:text-surface"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
