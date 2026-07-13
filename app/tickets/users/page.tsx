const users = [
  { name: "Jane Doe", email: "jane@university.edu", role: "Student" },
  { name: "Sam Lee", email: "sam@university.edu", role: "Student" },
  { name: "Priya Nair", email: "priya@university.edu", role: "Student" },
  { name: "Marcus Wright", email: "marcus@university.edu", role: "Advisor" },
  { name: "Dana Kim", email: "dana@university.edu", role: "Admin" },
];

const roleStyles: Record<string, string> = {
  Student: "bg-neutral-100 text-neutral-700",
  Advisor: "bg-blue-100 text-blue-700",
  Admin: "bg-purple-100 text-purple-700",
};

export default function UsersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <p className="mt-2 text-sm text-neutral-500">{users.length} registered users</p>

      <div className="mt-8 overflow-hidden rounded-lg border border-neutral-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {users.map((u) => (
              <tr key={u.email} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-neutral-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${roleStyles[u.role]}`}>
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
