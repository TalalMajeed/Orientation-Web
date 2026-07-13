export default function IssueTicketPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Issue a Ticket</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Submit a new support request to the orientation team.
      </p>

      <form className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Subject</label>
          <input
            type="text"
            placeholder="Missing housing assignment"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Category</label>
          <select className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400">
            <option>Housing</option>
            <option>Registration</option>
            <option>IT Support</option>
            <option>General</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Description</label>
          <textarea
            rows={5}
            placeholder="Describe your issue..."
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
        <button
          type="button"
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Submit Ticket
        </button>
      </form>
    </main>
  );
}
