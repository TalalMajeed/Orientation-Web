const tickets = [
  { id: "1024", subject: "Missing housing assignment", status: "Open", submitted: "Jul 10" },
  { id: "1023", subject: "Can't register for orientation course", status: "Pending", submitted: "Jul 10" },
  { id: "1022", subject: "Wifi not working in dorm", status: "Resolved", submitted: "Jul 9" },
  { id: "1021", subject: "Duplicate meal plan charge", status: "Open", submitted: "Jul 8" },
  { id: "1020", subject: "Need accessibility accommodation", status: "Pending", submitted: "Jul 7" },
];

const statusStyles: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
  Resolved: "bg-green-100 text-green-700",
};

export default function TicketsListPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">All Tickets</h1>
      <p className="mt-2 text-sm text-neutral-500">{tickets.length} tickets total</p>

      <div className="mt-8 overflow-hidden rounded-lg border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 text-neutral-500">#{t.id}</td>
                <td className="px-4 py-3 font-medium">{t.subject}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[t.status]}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500">{t.submitted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
