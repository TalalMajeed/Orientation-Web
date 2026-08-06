import Link from "next/link";
import Ticket, { type TicketProps } from "./Ticket";
import DecorEllipse from "./DecorEllipse";

const concert: TicketProps = {
  presenter: "NUST ON'26 presents",
  title: "Concert Night",
  subtitle: "Artist — To Be Announced",
  timingLabel: "Timing",
  timing: "Sept 2026 · TBA",
  venueLabel: "Venue",
  venue: "NUST, Islamabad",
  attendeeLabel: "Attendee",
  attendee: "Your Name",
  price: "1500 PKR",
  cols: [
    { label: "Section", value: "AA" },
    { label: "Row", value: "A" },
    { label: "Seat", value: "2" },
  ],
  scanText: "Scan at Entrance",
  bg: "linear-gradient(155deg, #E8641A 0%, #C2410C 55%, #8F3410 100%)",
};

const qawwali: TicketProps = {
  presenter: "این یو ایس ٹی او این '۲۶ پیش کرتا ہے",
  title: "شبِ قوّالی",
  subtitle: "فنکار: جلد اعلان",
  timingLabel: "وقت",
  timing: "ستمبر ۲۰۲۶",
  venueLabel: "مقام",
  venue: "نسٹ، اسلام آباد",
  attendeeLabel: "نام",
  attendee: "آپ کا نام",
  price: "۱۵۰۰ روپے",
  cols: [
    { label: "حصہ", value: "اے اے" },
    { label: "قطار", value: "اے" },
    { label: "نشست", value: "۲" },
  ],
  scanText: "داخلے پر اسکین کریں",
  bg: "linear-gradient(155deg, #24467F 0%, #132647 55%, #0A1526 100%)",
  rtl: true,
};

export default function DwTickets() {
  const pillDark =
    "rounded-full border-2 border-dotted border-transparent bg-fg px-6 py-4 font-italic italic text-sm text-surface transition-colors hover:bg-ember hover:text-cream";
  const pill =
    "rounded-full border-2 border-dotted border-fg/50 px-6 py-4 font-italic italic text-sm text-fg transition-colors hover:border-transparent hover:bg-fg hover:text-surface";

  return (
    <section id="tickets" className="relative overflow-hidden bg-surface px-6 py-28 sm:px-10">
      <DecorEllipse className="dw-spin pointer-events-none absolute right-[-10%] top-[8%] h-[60%] w-[52%] text-fg/15" />
      <div className="relative mx-auto max-w-[1600px]">
        <p className="max-w-4xl font-serif text-3xl leading-[1.15] text-fg sm:text-5xl">
          Two nights, one story. A live concert and an evening of qawwali —
          issue your pass once and carry the whole week in your pocket.
        </p>

        <div className="mt-16">
          <h2 className="font-serif font-bold text-[18vw] leading-[0.8] text-fg lg:text-[14vw]">
            Tickets
          </h2>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-dotted border-fg/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg/60">
            Coming soon — pricing &amp; dates not yet finalized
          </span>
        </div>

        <div className="mt-12 flex items-center justify-center rounded-[30px] border border-dashed border-fg/40 px-6 py-24 sm:px-10">
          <p className="font-serif text-4xl text-fg/60 sm:text-5xl">Coming Soon</p>
        </div>

        {/* The two tickets — commented out until pricing & dates are finalized.
        <div className="mt-10 flex flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:justify-center">
          <Ticket {...concert} />
          <Ticket {...qawwali} />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-3">
            <Link href="/event-tickets" className={pillDark}>
              Get your pass →
            </Link>
            <Link href="/schedule" className={pill}>
              View schedule
            </Link>
          </div>
          <p className="max-w-md font-sans text-sm leading-relaxed text-fg/60">
            Rs 1500 per event. Issued once, scanned everywhere — your key to
            every session, stall, and stage across the week.
          </p>
        </div>
        */}
      </div>
    </section>
  );
}
