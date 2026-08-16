export type LegalSection = {
  title: string;
  body: string[];
};

export default function LegalSections({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
      <p className="font-italic text-sm italic text-fg/50">— Legal</p>
      <h1 className="mt-4 font-serif text-[13vw] font-bold leading-[0.9] text-fg sm:text-[7vw]">
        {title}
      </h1>
      <p className="mt-4 font-italic text-sm italic text-fg/50">Last updated {updated}</p>

      <div className="mt-16 space-y-12 border-t border-dashed border-fg/20 pt-12">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-serif text-2xl font-bold text-fg sm:text-3xl">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-3 font-italic text-base italic leading-relaxed text-fg/70"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}
