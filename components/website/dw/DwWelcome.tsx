import AnimatedLogo from "./AnimatedLogo";

export default function DwWelcome() {
  return (
    <section className="bg-surface px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div>
          <p className="font-italic text-sm italic text-fg/50">— Welcome</p>
          <h2 className="mt-4 font-serif font-bold text-[16vw] leading-[0.85] text-fg lg:text-[11vw]">
            Welcome to NUST
          </h2>
          <p dir="rtl" lang="ur" className="mt-2 font-urdu text-3xl text-ember sm:text-5xl">
            نسٹ میں خوش آمدید
          </p>
          <p className="mt-12 max-w-3xl font-serif text-3xl leading-[1.15] text-fg sm:text-4xl">
            Pakistan&apos;s top-ranked university, home to eleven schools and
            a 700-acre campus in H-12, Islamabad — and for the next few days,
            the whole reason you&apos;re here. In a few weeks, this becomes
            more than an address on your acceptance letter. It becomes home.
          </p>
        </div>

        {/* A real divider — not just whitespace — between the two blocks. */}
        <div className="my-24 flex items-center gap-4 sm:my-32">
          <span className="h-px flex-1 border-t border-dashed border-fg/20" />
          <span className="h-2 w-2 rounded-full bg-fg/25" />
          <span className="h-px flex-1 border-t border-dashed border-fg/20" />
        </div>

        <div>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="font-italic text-sm italic text-fg/50">— Orientation</p>
              <h2 className="mt-4 font-serif font-bold text-[16vw] leading-[0.85] text-fg lg:text-[11vw]">
                Orientation
              </h2>
            </div>
            <AnimatedLogo className="h-16 w-auto shrink-0 sm:h-24" />
          </div>
          <p dir="rtl" lang="ur" className="mt-2 font-urdu text-3xl text-ember sm:text-5xl">
            اب کہانی تمہاری ہے
          </p>
          <p className="mt-12 max-w-3xl font-serif text-3xl leading-[1.15] text-fg sm:text-4xl">
            We don&apos;t just run a week of events. We identify a threshold
            — the moment you step from one life into another — and fill it
            with people, places, and stories. Every senior running it once
            stood exactly where you stand now; the pen is in your hand, the
            story is yours to write.
          </p>
        </div>
      </div>
    </section>
  );
}
