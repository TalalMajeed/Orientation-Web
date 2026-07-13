const schedule = [
  { time: "9:00 AM", title: "Welcome & Check-in", location: "Main Hall" },
  { time: "10:00 AM", title: "Campus Tour", location: "Meet at Quad" },
  { time: "12:00 PM", title: "Lunch with Advisors", location: "Dining Hall" },
  { time: "1:30 PM", title: "Course Registration Workshop", location: "Room 204" },
  { time: "3:00 PM", title: "Club Fair", location: "Student Union" },
  { time: "6:00 PM", title: "Welcome Social", location: "Courtyard" },
];

export default function PlanPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Orientation Plan</h1>
      <p className="mt-4 text-neutral-600">
        A sample schedule for orientation day. Times and locations are
        placeholders.
      </p>

      <ol className="mt-10 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {schedule.map((item) => (
          <li key={item.title} className="flex items-center gap-4 p-4">
            <span className="w-20 shrink-0 text-sm font-medium text-neutral-500">
              {item.time}
            </span>
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-neutral-500">{item.location}</div>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
