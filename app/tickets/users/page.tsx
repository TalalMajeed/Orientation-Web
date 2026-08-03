const users = [
  { name: "Jane Doe", email: "jane@university.edu", role: "Student" },
  { name: "Sam Lee", email: "sam@university.edu", role: "Student" },
  { name: "Priya Nair", email: "priya@university.edu", role: "Student" },
  { name: "Marcus Wright", email: "marcus@university.edu", role: "Advisor" },
  { name: "Dana Kim", email: "dana@university.edu", role: "Admin" },
];

const roleStyles: Record<string, string> = {
  Student: "border border-fg/20 bg-fg/[0.04] text-fg/60",
  Advisor: "border border-sky/40 bg-sky/15 text-fg",
  Admin: "border border-ember/40 bg-ember/10 text-ember",
};

export default function UsersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">Support Desk</p>
      <h1 className="mt-3 font-serif text-4xl font-bold text-fg sm:text-5xl">Users</h1>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-fg/50">
        {users.length} registered users
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-fg/12">
        <table className="w-full min-w-[560px] border-collapse text-left font-mono text-[12px]">
          <thead>
            <tr className="border-b border-fg/15 text-fg/45">
              {["Name", "Email", "Role"].map((h) => (
                <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-[0.12em]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.email}
                className="border-b border-fg/8 text-fg/80 transition-colors hover:bg-fg/[0.03]"
              >
                <td className="px-4 py-3 font-sans font-medium text-fg">{u.name}</td>
                <td className="px-4 py-3 text-fg/60">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] ${roleStyles[u.role]}`}
                  >
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
