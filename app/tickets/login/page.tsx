export default function TicketsLoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Access the ticketing system with your student account.
      </p>

      <form className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Email</label>
          <input
            type="email"
            placeholder="jane@university.edu"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
        <button
          type="button"
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Sign In
        </button>
      </form>
    </main>
  );
}
