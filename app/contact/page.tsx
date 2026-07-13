export default function ContactPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Contact Us</h1>
      <p className="mt-4 text-neutral-600">
        Have a question about orientation? Send us a message and the team
        will get back to you.
      </p>

      <form className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Name</label>
          <input
            type="text"
            placeholder="Jane Doe"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Email</label>
          <input
            type="email"
            placeholder="jane@university.edu"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Message</label>
          <textarea
            rows={5}
            placeholder="How can we help?"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
        <button
          type="button"
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Send Message
        </button>
      </form>
    </main>
  );
}
