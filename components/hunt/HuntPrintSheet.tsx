"use client";

import { useEffect, useState } from "react";

interface HuntCodeDto {
  id: string;
  code: string;
  label: string | null;
  qrDataUrl: string;
}

export default function HuntPrintSheet() {
  const [codes, setCodes] = useState<HuntCodeDto[] | null>(null);

  useEffect(() => {
    fetch("/api/v1/hunt/codes")
      .then((response) => response.json())
      .then((data) => setCodes(data.codes ?? []));
  }, []);

  useEffect(() => {
    if (!codes || codes.length === 0) return;

    // Data-URL images paint synchronously, but give the layout a beat before
    // the print dialog steals focus.
    const timer = setTimeout(() => window.print(), 500);
    return () => clearTimeout(timer);
  }, [codes]);

  if (!codes) {
    return <p className="p-10 font-mono text-sm text-black/50">Loading codes…</p>;
  }

  if (codes.length === 0) {
    return (
      <p className="p-10 font-mono text-sm text-black/50">
        No codes to print yet — generate a batch first.
      </p>
    );
  }

  return (
    <div className="bg-white text-black">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white p-6 print:hidden">
        <h1 className="font-serif text-2xl font-bold">
          Scavenger Hunt — {codes.length} sign{codes.length === 1 ? "" : "s"} (1 per page)
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-full bg-black px-5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white"
          >
            Print / Save as PDF
          </button>
          <a
            href="/hunt"
            className="rounded-full border border-black/20 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-black"
          >
            Back
          </a>
        </div>
      </div>

      {codes.map((c) => (
        <div
          key={c.id}
          className="hunt-print-page flex min-h-screen flex-col items-center justify-center gap-6 px-10 py-16 text-center"
        >
          <p className="font-serif text-3xl font-bold sm:text-5xl">You found treasure!</p>
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-black/60 sm:text-base">
            Scan to get it
          </p>

          {/* eslint-disable-next-line @next/next/no-img-element -- data URL, no optimization needed */}
          <img src={c.qrDataUrl} alt={c.code} className="h-72 w-72" />

          <p className="font-mono text-lg font-bold tracking-[0.15em]">{c.code}</p>
          {c.label && (
            <p className="font-mono text-xs uppercase tracking-[0.1em] text-black/40">{c.label}</p>
          )}
        </div>
      ))}

      <style>{`
        @media print {
          @page { margin: 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .hunt-print-page {
            break-after: page;
            break-inside: avoid;
            min-height: auto;
          }
          .hunt-print-page:last-child {
            break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}
