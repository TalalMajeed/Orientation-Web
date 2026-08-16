import FloatingLogo from "@/components/site/logo";

const campusStats = [
  { value: "11", label: "Schools" },
  { value: "700", label: "Acre Campus" },
  { value: "H-12", label: "Islamabad" },
];

const orientationHighlights = [
  { value: "01", label: "Meet your OG family" },
  { value: "02", label: "Tour the full campus" },
  { value: "03", label: "Make it yours" },
];

function PictureFrame({
  caption,
  src,
  className = "",
}: {
  caption: string;
  src?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="border-2 border-black p-3">
        <div className="relative aspect-[4/5] w-full overflow-hidden border-2 border-black bg-fg/[0.04]">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={caption} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <>
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 14px)",
                  color: "var(--color-fg)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <FloatingLogo className="h-16 w-auto opacity-30 sm:h-20" />
              </div>
              <span className="absolute left-3 top-3 border border-black bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-fg">
                Photo
              </span>
            </>
          )}
        </div>
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg/50">{caption}</p>
    </div>
  );
}

export default function WelcomeSection() {
  return (
    <section className="bg-surface px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="font-serif text-[16vw] font-bold leading-[0.85] text-fg lg:text-[11vw]">
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

            <div className="mt-10 flex flex-wrap gap-x-10 gap-y-6 border-t border-dashed border-fg/20 pt-8">
              {campusStats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-serif text-4xl text-fg">{stat.value}</p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-fg/50">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <PictureFrame
            src="/frame1.png"
            caption="Fig. 01 — H-12, Islamabad"
            className="lg:col-span-5"
          />
        </div>

        <div className="my-24 flex items-center gap-4 sm:my-32">
          <span className="h-px flex-1 border-t border-dashed border-fg/20" />
          <span className="h-2 w-2 rounded-full bg-fg/25" />
          <span className="h-px flex-1 border-t border-dashed border-fg/20" />
        </div>

        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
          <PictureFrame
            caption="Fig. 02 — Orientation Week"
            src="/frame2.png"
            className="lg:order-1 lg:col-span-5"
          />

          <div className="lg:order-2 lg:col-span-7 lg:text-right">
            <h2 className="font-serif text-[16vw] font-bold leading-[0.85] text-fg lg:text-[11vw]">
              Orientation
            </h2>
            <p dir="rtl" lang="ur" className="mt-2 font-urdu text-3xl text-ember sm:text-5xl">
              اب کہانی تمہاری ہے
            </p>
            <p className="mt-12 max-w-3xl font-serif text-3xl leading-[1.15] text-fg sm:text-4xl lg:ml-auto">
              We don&apos;t just run a week of events. We identify a threshold
              — the moment you step from one life into another — and fill it
              with people, places, and stories. Every senior running it once
              stood exactly where you stand now; the pen is in your hand, the
              story is yours to write.
            </p>

            <div className="mt-10 flex flex-wrap justify-start gap-x-10 gap-y-6 border-t border-dashed border-fg/20 pt-8 lg:justify-end">
              {orientationHighlights.map((highlight) => (
                <div key={highlight.label} className="lg:text-right">
                  <p className="font-mono text-xs tracking-[0.14em] text-ember">{highlight.value}</p>
                  <p className="mt-1 max-w-[10rem] font-serif text-lg text-fg">{highlight.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
