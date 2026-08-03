"use client";

import { useCallback, useEffect, useState } from "react";

import EventPicker from "./EventPicker";
import { useEvents } from "./useEvents";
import { formatPakistanDateTime } from "@/services/tickets/time";
import type { TicketDto, TicketStatus } from "@/services/tickets/types";

const FILTERS: { label: string; value: TicketStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Issued", value: "issued" },
  { label: "Used", value: "used" },
  { label: "Revoked", value: "revoked" },
];

const STATUS_STYLES: Record<TicketStatus, string> = {
  issued: "border border-sky/40 bg-sky/15 text-fg",
  used: "border border-transparent bg-fg text-surface",
  revoked: "border border-ember/40 bg-ember/10 text-ember",
};

export default function TicketList() {
  const { events, eventId, selectEvent } = useEvents();
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) {
      return;
    }

    setLoading(true);

    const params = new URLSearchParams({ eventId, page: String(page) });

    if (status !== "all") {
      params.set("status", status);
    }

    if (query) {
      params.set("search", query);
    }

    const response = await fetch(`/api/v1/event-tickets?${params}`);

    if (response.ok) {
      const data = await response.json();
      setTickets(data.tickets ?? []);
      setTotal(data.total ?? 0);
      setPageSize(data.pageSize ?? 50);
    }

    setLoading(false);
  }, [eventId, page, query, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- results follow the filters
    load();
  }, [load]);

  function submitSearch(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  async function revoke(ticket: TicketDto) {
    setBusyId(ticket.id);
    setNotice(null);

    const response = await fetch(`/api/v1/event-tickets/${ticket.id}`, {
      method: "DELETE",
    });
    const data = await response.json().catch(() => ({}));

    setBusyId(null);

    if (!response.ok) {
      setNotice(typeof data.error === "string" ? data.error : "Could not revoke");
      return;
    }

    setNotice(`Revoked ${ticket.holderName}'s ticket.`);
    await load();
  }

  async function resend(ticket: TicketDto) {
    setBusyId(ticket.id);
    setNotice(null);

    const response = await fetch(`/api/v1/event-tickets/${ticket.id}`, {
      method: "POST",
    });
    const data = await response.json().catch(() => ({}));

    setBusyId(null);

    if (!response.ok) {
      setNotice(typeof data.error === "string" ? data.error : "Could not resend");
      return;
    }

    setNotice(
      `${ticket.holderName} is back in the send queue — run "Start sending" on the Issue page. Their existing QR keeps working.`
    );
    await load();
  }

  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  const pill =
    "rounded-full border-2 border-dotted px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors";
  const pillOn = "border-transparent bg-fg text-surface";
  const pillOff = "border-fg/40 text-fg hover:border-fg";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-5xl font-bold text-fg">Tickets</h1>
        <div className="flex items-center gap-2">
          <EventPicker events={events} eventId={eventId} onSelect={selectEvent} />
          {eventId && (
            <a
              href={`/api/v1/event-tickets/export?eventId=${eventId}`}
              className={`${pill} ${pillOff}`}
            >
              Export CSV
            </a>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <form onSubmit={submitSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email"
            className="w-64 rounded-full border-2 border-dotted border-fg/40 bg-transparent px-4 py-1.5 font-mono text-[11px] text-fg placeholder:text-fg/30 focus:border-fg focus:outline-none"
          />
          <button type="submit" className={`${pill} ${pillOff}`}>
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setPage(1);
                setStatus(filter.value);
              }}
              className={`${pill} ${status === filter.value ? pillOn : pillOff}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <p className="mt-5 rounded-2xl border border-dashed border-fg/25 bg-fg/[0.02] p-4 font-mono text-[12px] leading-relaxed text-fg/70">
          {notice}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-fg/12">
        <table className="w-full min-w-[880px] border-collapse text-left font-mono text-[12px]">
          <thead>
            <tr className="border-b border-fg/15 text-fg/45">
              {["Name", "Email", "Status", "Emailed", "Checked in", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-[0.12em]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-4 text-fg/45" colSpan={6}>
                  Loading…
                </td>
              </tr>
            )}

            {!loading && tickets.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center uppercase tracking-[0.1em] text-fg/40" colSpan={6}>
                  No tickets match.
                </td>
              </tr>
            )}

            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-fg/8 text-fg/80 transition-colors hover:bg-fg/[0.03]">
                <td className="px-4 py-3 font-sans font-medium text-fg">{ticket.holderName}</td>
                <td className="px-4 py-3 text-fg/60">{ticket.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] ${STATUS_STYLES[ticket.status]}`}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-fg/60">
                  {ticket.emailError ? (
                    <span className="text-ember" title={ticket.emailError}>
                      Failed ({ticket.emailAttempts})
                    </span>
                  ) : (
                    formatPakistanDateTime(ticket.emailSentAt)
                  )}
                </td>
                <td className="px-4 py-3 text-fg/60">
                  {formatPakistanDateTime(ticket.usedAt)}
                  {ticket.usedGate ? ` · ${ticket.usedGate}` : ""}
                </td>
                <td className="space-x-3 whitespace-nowrap px-4 py-3">
                  {ticket.status === "issued" ? (
                    <>
                      <button
                        type="button"
                        disabled={busyId === ticket.id}
                        onClick={() => resend(ticket)}
                        className="uppercase tracking-[0.08em] text-fg underline decoration-dotted underline-offset-4 transition-colors hover:text-sky disabled:opacity-50"
                      >
                        Resend
                      </button>
                      <button
                        type="button"
                        disabled={busyId === ticket.id}
                        onClick={() => revoke(ticket)}
                        className="uppercase tracking-[0.08em] text-ember underline decoration-dotted underline-offset-4 disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    </>
                  ) : (
                    <span className="text-fg/30">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.1em] text-fg/50">
        <span>
          {total} ticket{total === 1 ? "" : "s"} · page {page} of {lastPage}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-full border-2 border-dotted border-fg/40 px-4 py-1.5 text-fg transition-colors hover:border-fg disabled:opacity-30"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-full border-2 border-dotted border-fg/40 px-4 py-1.5 text-fg transition-colors hover:border-fg disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
