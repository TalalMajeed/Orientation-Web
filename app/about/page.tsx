export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">About Orientation</h1>
      <p className="mt-4 text-neutral-600">
        Orientation Web helps new students find their way around campus, meet
        their cohort, and get set up for the semester ahead. This page is a
        placeholder for the full about content.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {[
          { label: "Students onboarded", value: "4,200+" },
          { label: "Campus events", value: "35" },
          { label: "Years running", value: "8" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-neutral-200 p-5">
            <div className="text-2xl font-semibold">{stat.value}</div>
            <div className="mt-1 text-sm text-neutral-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-medium">Our Mission</h2>
        <p className="mt-2 text-neutral-600">
          Placeholder copy describing the mission of the orientation program,
          the team behind it, and how incoming students can get involved.
        </p>
      </section>
    </main>
  );
}
