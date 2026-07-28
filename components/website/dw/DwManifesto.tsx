import DecorEllipse from "./DecorEllipse";

export default function DwManifesto() {
  return (
    <section className="relative overflow-hidden bg-surface px-6 py-28 sm:px-10 sm:py-36">
      <DecorEllipse className="dw-spin pointer-events-none absolute left-[-10%] top-[12%] h-[70%] w-[60%] text-fg/20" />
      <div className="relative mx-auto max-w-[1600px]">
        <p className="font-italic text-sm italic text-fg/50">— Manifesto</p>

        <h2 className="mt-6 font-serif font-bold text-[15vw] leading-[0.9] text-fg sm:text-[13vw]">
          Ab Kahani Tumhari&nbsp;Hai
        </h2>
        <p dir="rtl" lang="ur" className="mt-2 font-urdu text-3xl text-ember sm:text-5xl">
          اب کہانی تمہاری ہے
        </p>

        <div className="mt-16 grid gap-10 md:grid-cols-2 md:gap-16">
          <p className="font-serif text-3xl leading-[1.15] text-fg sm:text-4xl">
            We don&apos;t just run a week of events. We identify a threshold — the
            moment you step from one life into another — and fill it with people,
            places, and stories.
          </p>
          <p className="max-w-md font-sans text-base leading-relaxed text-fg/70">
            With heart and mind, we see the person behind the roll number.
            Orientation is where strangers become your batch, a new campus
            becomes home, and your NUST story finally begins.
            <br />
            <br />
            Every moment is built by a team of seniors who once stood exactly
            where you stand now. The pen is in your hand — the story is yours to
            write.
          </p>
        </div>
      </div>
    </section>
  );
}
