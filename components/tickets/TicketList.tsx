"use client";

import { useCallback, useEffect, useState } from "react";

import EventPicker from "./EventPicker";
import { useEvents } from "./useEvents";
import { formatPakistanDateTime } from "@/services/tickets/time";
import type { TicketDto, TicketStatus } from "@/services/tickets/types";

/** "No email" is a delivery filter, not a status — the API takes it separately. */
type Filter = TicketStatus | "all" | "undelivered";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Issued", value: "issued" },
  { label: "Used", value: "used" },
  { label: "Revoked", value: "revoked" },
  { label: "No email", value: "undelivered" },
];

const STATUS_STYLES: Record<TicketStatus, string> = {
  issued: "bg-blue-100 text-blue-700",
  used: "bg-green-100 text-green-700",
  revoked: "bg-neutral-200 text-neutral-600",
};

/**
 * The old cell said "Failed (3)" for both a ticket the drain will pick up again
 * and one it has abandoned. Those need different reactions from HR, so they get
 * different words. The provider's message stays in the tooltip — it is for us,
 * not for them.
 */
function DeliveryCell({ ticket }: { ticket: TicketDto }) {
  if (ticket.delivery === "sent") {
    return <>{formatPakistanDateTime(ticket.emailSentAt)}</>;
  }

  if (ticket.delivery === "undeliverable") {
    return (
      <span
        className="font-medium text-red-600"
        title={ticket.emailError ?? undefined}
      >
        Never arrived
      </span>
    );
  }

  if (ticket.delivery === "retrying") {
    return (
      <span className="text-amber-700" title={ticket.emailError ?? undefined}>
        Retrying
      </span>
    );
  }

  return <span className="text-neutral-400">Waiting to send</span>;
}

export default function TicketList({
  initialFilter = "all",
}: {
  initialFilter?: Filter;
}) {
  const { events, eventId, selectEvent } = useEvents();
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filter, setFilter] = useState<Filter>(initialFilter);
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

    if (filter === "undelivered") {
      params.set("delivery", "undelivered");
    } else if (filter !== "all") {
      params.set("status", filter);
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
  }, [eventId, page, query, filter]);

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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
        <div className="flex items-center gap-2">
          <EventPicker events={events} eventId={eventId} onSelect={selectEvent} />
          {eventId && (
            <a
              href={`/api/v1/event-tickets/export?eventId=${eventId}`}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Export CSV
            </a>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form onSubmit={submitSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email"
            className="w-64 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Search
          </button>
        </form>

        <div className="flex gap-1">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setPage(1);
                setFilter(option.value);
              }}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                filter === option.value
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <p className="mt-4 rounded-md border border-neutral-200 bg-white p-3 text-sm">
          {notice}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Emailed</th>
              <th className="px-4 py-3 font-medium">Checked in</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {loading && (
              <tr>
                <td className="px-4 py-3 text-neutral-500" colSpan={6}>
                  Loading…
                </td>
              </tr>
            )}

            {!loading && tickets.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-neutral-500" colSpan={6}>
                  No tickets match.
                </td>
              </tr>
            )}

            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium">{ticket.holderName}</td>
                <td className="px-4 py-3 text-neutral-500">{ticket.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[ticket.status]}`}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  <DeliveryCell ticket={ticket} />
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {formatPakistanDateTime(ticket.usedAt)}
                  {ticket.usedGate ? ` · ${ticket.usedGate}` : ""}
                </td>
                <td className="space-x-3 px-4 py-3 whitespace-nowrap">
                  {ticket.status === "issued" ? (
                    <>
                      <button
                        type="button"
                        disabled={busyId === ticket.id}
                        onClick={() => resend(ticket)}
                        className="text-neutral-900 underline disabled:opacity-50"
                      >
                        Resend
                      </button>
                      <button
                        type="button"
                        disabled={busyId === ticket.id}
                        onClick={() => revoke(ticket)}
                        className="text-red-600 underline disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    </>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
        <span>
          {total} ticket{total === 1 ? "" : "s"} · page {page} of {lastPage}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
