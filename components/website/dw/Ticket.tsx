const BAR_WIDTHS = [
  3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1,
  2, 1, 3, 1, 2, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 1, 2, 1,
];

function Barcode() {
  return (
    <div className="flex h-14 items-stretch justify-center gap-[2px]" aria-hidden>
      {BAR_WIDTHS.map((w, i) => (
        <span key={i} style={{ width: w }} className="h-full bg-cream/90" />
      ))}
    </div>
  );
}

export type TicketProps = {
  presenter: string;
  title: string;
  subtitle: string;
  timingLabel: string;
  timing: string;
  venueLabel: string;
  venue: string;
  attendeeLabel: string;
  attendee: string;
  price: string;
  cols: { label: string; value: string }[];
  scanText: string;
  bg: string;
  rtl?: boolean;
};

export default function Ticket({
  presenter,
  title,
  subtitle,
  timingLabel,
  timing,
  venueLabel,
  venue,
  attendeeLabel,
  attendee,
  price,
  cols,
  scanText,
  bg,
  rtl = false,
}: TicketProps) {
  const label = rtl
    ? "font-urdu text-sm text-cream/60"
    : "font-mono text-[10px] uppercase tracking-[0.18em] text-cream/55";
  const value = rtl ? "font-urdu text-xl text-cream" : "font-heading text-base font-semibold text-cream";
  const titleCls = rtl
    ? "font-urdu text-4xl leading-tight text-cream"
    : "font-heading text-3xl font-bold uppercase leading-[0.95] text-cream";

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="relative flex w-full max-w-[360px] flex-col overflow-hidden rounded-3xl text-cream shadow-2xl"
      style={{ background: bg }}
    >
      {/* Top: title + timing + venue */}
      <div className="flex-1 px-7 pt-7 pb-6 text-left">
        <p className={rtl ? "font-urdu text-base text-cream/70" : "font-mono text-[10px] uppercase tracking-[0.2em] text-cream/70"}>
          {presenter}
        </p>
        <h3 className={`mt-3 ${titleCls}`}>{title}</h3>
        <p className={rtl ? "mt-2 font-urdu text-base text-cream/70" : "mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-cream/70"}>
          {subtitle}
        </p>

        <div className="mt-7">
          <p className={label}>{timingLabel}</p>
          <p className={`mt-1 ${value}`}>{timing}</p>
        </div>
        <div className="mt-5">
          <p className={label}>{venueLabel}</p>
          <p className={`mt-1 ${value}`}>{venue}</p>
        </div>
      </div>

      {/* Perforation with side notches */}
      <div className="relative">
        <div className="mx-6 border-t border-dashed border-cream/40" />
        <span className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface" style={{ left: 0 }} />
        <span className="absolute top-1/2 h-6 w-6 translate-x-1/2 -translate-y-1/2 rounded-full bg-surface" style={{ right: 0 }} />
      </div>

      {/* Attendee + price */}
      <div className="flex items-center justify-between px-7 pt-6">
        <div>
          <p className={label}>{attendeeLabel}</p>
          <p className={`mt-1 ${value}`}>{attendee}</p>
        </div>
        <span className={rtl ? "font-urdu text-2xl text-cream" : "font-heading text-lg font-bold text-cream"}>
          {price}
        </span>
      </div>

      {/* Section / Row / Seat */}
      <div className="mt-6 grid grid-cols-3 border-y border-cream/15">
        {cols.map((c, i) => (
          <div
            key={i}
            className={`px-7 py-4 text-center ${i < cols.length - 1 ? "border-r border-cream/15" : ""}`}
          >
            <p className={label}>{c.label}</p>
            <p className={`mt-1 ${value}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Barcode */}
      <div className="px-7 pb-7 pt-6" dir="ltr">
        <p className={`mb-3 text-center ${rtl ? "font-urdu text-sm text-cream/70" : "font-mono text-[10px] uppercase tracking-[0.2em] text-cream/70"}`}>
          {scanText}
        </p>
        <Barcode />
      </div>
    </div>
  );
}
