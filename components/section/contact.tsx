import CampusExplorer from "@/components/campus/explorer";
import ContactForm from "@/components/section/form";

const details = [
  {
    label: "General",
    value: "info@orientation.nust.edu.pk",
    href: "mailto:info@orientation.nust.edu.pk",
  },
  {
    label: "Support",
    value: "support@orientation.nust.edu.pk",
    href: "mailto:support@orientation.nust.edu.pk",
  },
  { label: "Location", value: "NUST, H-12, Islamabad", href: null },
  { label: "Hours", value: "Mon–Sat · 9am – 5pm PKT", href: null },
];

export default function ContactSection() {
  return (
    <section className="bg-surface px-6 pb-16 pt-24 sm:px-10 sm:pt-32">
      <div className="mx-auto max-w-[1600px]">
        <p className="font-italic text-sm italic text-fg/50">— Contact &amp; Map</p>
        <h1 className="mt-4 font-serif text-[16vw] font-bold leading-[0.85] text-fg lg:text-[7vw]">
          Say hello
        </h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            <p className="font-serif text-2xl leading-[1.3] text-fg sm:text-3xl">
              Questions about Orientation Week, the schedule, or your house? The
              organizing team is one message away.
            </p>
            <ContactForm />

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {details.map((detail) => (
                <div key={detail.label} className="rounded-2xl border border-fg/12 p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/45">
                    {detail.label}
                  </p>
                  {detail.href ? (
                    <a href={detail.href} className="link-sweep mt-2 block font-serif text-lg text-fg">
                      {detail.value}
                    </a>
                  ) : (
                    <p className="mt-2 font-serif text-lg text-fg">{detail.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:self-start">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg/45">
              Find your way — Campus Map
            </p>
            <CampusExplorer className="mt-3" mapClassName="h-[420px] lg:h-[560px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
