import DecorEllipse from "./DecorEllipse";

export default function DwEvents() {
  return (
    <section id="events" className="relative overflow-hidden bg-surface px-6 py-28 sm:px-10">
      <DecorEllipse className="dw-spin pointer-events-none absolute right-[-10%] top-[8%] h-[60%] w-[52%] text-fg/15" />
      <div className="relative mx-auto max-w-[1600px]">
        <p className="font-italic text-sm italic text-fg/50">— What&apos;s on</p>
        <div className="mt-4">
          <h2 className="font-serif font-bold text-[18vw] leading-[0.8] text-fg lg:text-[14vw]">
            Events
          </h2>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-dotted border-fg/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg/60">
            Coming soon — Scavenger Hunt &amp; Social Night details not yet finalized
          </span>
        </div>

        <div className="mt-12 flex items-center justify-center rounded-[30px] border border-dashed border-fg/40 px-6 py-24 sm:px-10">
          <p className="font-serif text-4xl text-fg/60 sm:text-5xl">Coming Soon</p>
        </div>
      </div>
    </section>
  );
}

