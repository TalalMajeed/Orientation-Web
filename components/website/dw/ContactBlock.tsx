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
    <section className="bg-surface px-6 pb-10 pt-24 sm:px-10 sm:pt-32">
      <div className="mx-auto max-w-[1600px]">
        <p className="font-italic text-sm italic text-fg/50">— Contact</p>
        <h1 className="mt-4 font-serif font-bold text-[16vw] leading-[0.85] text-fg lg:text-[11vw]">
          Say hello
        </h1>

        <div className="mt-14 grid gap-12 md:grid-cols-[1.3fr_1fr]">
          <p className="font-serif text-3xl leading-[1.15] text-fg sm:text-4xl">
            Questions about Orientation Week, tickets, or your house? The
            organizing team is one message away.
          </p>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {details.map((d) => (
                <div key={d.label}>
                  <p className="font-italic text-sm italic text-fg/45">{d.label}</p>
                  {d.href ? (
                    <a
                      href={d.href}
                      className="link-sweep mt-1 font-mono text-[12px] uppercase tracking-[0.08em] text-fg"
                    >
                      {d.value}
                    </a>
                  ) : (
                    <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.08em] text-fg">
                      {d.value}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="rounded-full border-2 border-dotted border-fg/40 px-4 py-1.5 font-italic text-sm italic text-fg transition-colors hover:border-transparent hover:bg-fg hover:text-surface"
                >
                  {s.label}
                </a>
              ))}
            </div>

            <a
              href="mailto:info@nustorientation.pk"
              className="mt-4 inline-block rounded-full border-2 border-dotted border-transparent bg-ember px-8 py-4 font-italic text-sm italic text-cream transition hover:brightness-110"
            >
              Email the team →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
