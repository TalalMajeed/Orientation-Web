import TicketList from "@/components/tickets/TicketList";

/**
 * `?filter=undelivered` lets the "never arrived" warnings elsewhere link
 * straight to the affected people. Read here rather than with useSearchParams so
 * the client component needs no Suspense boundary.
 */
export default async function TicketsListPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <TicketList
        initialFilter={filter === "undelivered" ? "undelivered" : undefined}
      />
    </main>
  );
}
