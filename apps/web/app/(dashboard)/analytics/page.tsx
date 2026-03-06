export default function AnalyticsOverview() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics Overview</h1>

      {/* Class Selector */}
      <div className="mb-6">
        <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
          <option>Period 3 Math</option>
          <option>Period 5 Science</option>
          <option>All Classes</option>
        </select>
      </div>

      {/* Concept Mastery Grid */}
      <h2 className="text-lg font-semibold mb-4">Concept Mastery Grid</h2>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-8 dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600">Student</th>
              <th className="p-3 font-medium text-gray-600">Arithmetic</th>
              <th className="p-3 font-medium text-gray-600">Fractions</th>
              <th className="p-3 font-medium text-gray-600">Algebra</th>
              <th className="p-3 font-medium text-gray-600">Geometry</th>
              <th className="p-3 font-medium text-gray-600">Functions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {[
              { name: "Maria S.", scores: [95, 90, 75, 80, 60] },
              { name: "Ahmed K.", scores: [80, 65, 70, 55, 45] },
              { name: "Lina C.", scores: [98, 92, 88, 85, 78] },
              { name: "Omar A.", scores: [60, 45, 40, 50, 30] },
              { name: "Sofia P.", scores: [85, 78, 72, 68, 55] },
            ].map((s) => (
              <tr key={s.name}>
                <td className="p-3 font-medium">{s.name}</td>
                {s.scores.map((score, i) => (
                  <td key={i} className="p-3 text-center">
                    <span
                      className={`inline-block w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        score >= 80
                          ? "bg-green-100 text-green-700"
                          : score >= 60
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {score}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Engagement Trends */}
      <h2 className="text-lg font-semibold mb-4">Engagement Trends (Last 7 Days)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Sessions", value: "142", change: "+12%" },
          { label: "Avg Time/Session", value: "8.2 min", change: "+5%" },
          { label: "Active Students", value: "28/30", change: "stable" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500">{m.label}</p>
            <p className="text-xl font-bold mt-1">{m.value}</p>
            <p className={`text-xs mt-1 ${m.change.startsWith("+") ? "text-green-600" : "text-gray-500"}`}>
              {m.change}
            </p>
          </div>
        ))}
      </div>

      {/* At-Risk Alerts */}
      <h2 className="text-lg font-semibold mb-4">At-Risk Alerts</h2>
      <div className="space-y-3">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:bg-red-900/10 dark:border-red-800">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-lg">⚠️</span>
            <div>
              <p className="font-medium text-sm">Omar Ali — Engagement Declining</p>
              <p className="text-xs text-gray-600 mt-1">
                Only 3 sessions in the past week (down from 7). Accuracy dropped to 58%.
                Frustration indicators elevated after algebra questions.
              </p>
              <p className="text-xs text-brand-600 font-medium mt-2">
                Suggested: Check in with Omar. Consider reducing algebra difficulty.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
