import Link from "next/link";
import Ticket, { type TicketProps } from "./Ticket";
import DecorEllipse from "./DecorEllipse";

const hunt: TicketProps = {
  presenter: "NUST ON'26 presents",
  title: "SCAVENGER HUNT",
  subtitle: "Coming Soon",
  timingLabel: "Timing",
  timing: "TBA",
  venueLabel: "Venue",
  venue: "Across Campus",
  attendeeLabel: "Team",
  attendee: "Your OG Group",
  price: "TBA",
  cols: [
    { label: "Format", value: "TBA" },
    { label: "Clues", value: "TBA" },
    { label: "Prize", value: "TBA" },
  ],
  scanText: "Details Coming Soon",
  bg: "linear-gradient(155deg, #E8641A 0%, #C2410C 55%, #8F3410 100%)",
};

const social: TicketProps = {
  presenter: "NUST ON'26 presents",
  title: "SOCIAL NIGHT",
  subtitle: "Coming Soon",
  timingLabel: "Timing",
  timing: "TBA",
  venueLabel: "Venue",
  venue: "NUST, Islamabad",
  attendeeLabel: "Attendee",
  attendee: "Your Name",
  price: "TBA",
  cols: [
    { label: "Nights", value: "TBA" },
    { label: "Access", value: "TBA" },
    { label: "Seat", value: "TBA" },
  ],
  scanText: "Details Coming Soon",
  bg: "linear-gradient(155deg, #3D66A9 0%, #2A5290 55%, #132647 100%)",
};

export default function DwEvents() {
  const pillDark =
    "rounded-full border-2 border-dotted border-transparent bg-fg px-6 py-4 font-italic italic text-sm text-surface transition-colors hover:bg-ember hover:text-cream";
  const pill =
    "rounded-full border-2 border-dotted border-fg/50 px-6 py-4 font-italic italic text-sm text-fg transition-colors hover:border-transparent hover:bg-fg hover:text-surface";

  return (
    <section id="events" className="relative overflow-hidden bg-surface px-6 py-28 sm:px-10">
      <DecorEllipse className="dw-spin pointer-events-none absolute right-[-10%] top-[8%] h-[60%] w-[52%] text-fg/15" />
      <div className="relative mx-auto max-w-[1600px]">
        <p className="max-w-4xl font-serif text-3xl leading-[1.15] text-fg sm:text-5xl">
          Two ways to be part of the story — race the campus by day, and dance
          the night away after.
        </p>

        <h2 className="mt-16 font-serif font-bold text-[18vw] leading-[0.8] text-fg lg:text-[14vw]">
          Events
        </h2>

        {/* The two events */}
        <div className="mt-10 flex flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:justify-center">
          <Link
            href="/scavenger-hunt"
            className="opacity-80 backdrop-blur-sm transition hover:opacity-100 hover:brightness-110"
          >
            <Ticket {...hunt} />
          </Link>
          <Link
            href="/passes"
            className="opacity-80 backdrop-blur-sm transition hover:opacity-100 hover:brightness-110"
          >
            <Ticket {...social} />
          </Link>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-3">
            <Link href="/passes" className={pillDark}>
              Get your pass →
            </Link>
            <Link href="/scavenger-hunt" className={pill}>
              See leaderboard
            </Link>
          </div>
          <p className="max-w-md font-sans text-sm leading-relaxed text-fg/60">
            Both events are still being finalized — check back soon for
            timing, pricing, and how to get in.
          </p>
        </div>
      </div>
    </section>
  );
}
