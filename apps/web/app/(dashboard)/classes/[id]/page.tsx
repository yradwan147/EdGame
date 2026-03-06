export default function ClassView({ params }: { params: { id: string } }) {
  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <a href="/" className="hover:text-brand-600">Home</a>
        <span className="mx-2">/</span>
        <span>Class: {params.id}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Period 3 Math</h1>
        <span className="text-sm text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded dark:bg-gray-800">
          {params.id}
        </span>
      </div>

      {/* Class Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Class Accuracy", value: "72%" },
          { label: "Avg Session Time", value: "8.5 min" },
          { label: "Completion Rate", value: "85%" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500">{m.label}</p>
            <p className="text-xl font-bold mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Student Roster */}
      <h2 className="text-lg font-semibold mb-4">Students</h2>
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600">Name</th>
              <th className="text-left p-3 font-medium text-gray-600">Sessions</th>
              <th className="text-left p-3 font-medium text-gray-600">Accuracy</th>
              <th className="text-left p-3 font-medium text-gray-600">Trend</th>
              <th className="text-left p-3 font-medium text-gray-600">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {[
              { name: "Maria Santos", sessions: 8, accuracy: "85%", trend: "up", lastActive: "2h ago" },
              { name: "Ahmed Khan", sessions: 5, accuracy: "72%", trend: "stable", lastActive: "1d ago" },
              { name: "Lina Chen", sessions: 10, accuracy: "91%", trend: "up", lastActive: "3h ago" },
              { name: "Omar Ali", sessions: 3, accuracy: "58%", trend: "down", lastActive: "3d ago" },
              { name: "Sofia Petrov", sessions: 6, accuracy: "78%", trend: "up", lastActive: "5h ago" },
            ].map((s) => (
              <tr key={s.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="p-3">
                  <a href={`/students/${s.name.split(" ")[0].toLowerCase()}`} className="text-brand-600 hover:underline font-medium">
                    {s.name}
                  </a>
                </td>
                <td className="p-3 text-gray-600">{s.sessions}</td>
                <td className="p-3 text-gray-600">{s.accuracy}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.trend === "up" ? "bg-green-100 text-green-700" :
                    s.trend === "down" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {s.trend === "up" ? "↑" : s.trend === "down" ? "↓" : "→"} {s.trend}
                  </span>
                </td>
                <td className="p-3 text-gray-500">{s.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assignments */}
      <h2 className="text-lg font-semibold mt-8 mb-4">Assignments</h2>
      <div className="space-y-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Fractions Practice — Week 1</h3>
              <p className="text-sm text-gray-500 mt-1">Pulse Realms · Due Mar 21</p>
            </div>
            <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
