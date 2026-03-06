export default function StudentDetail({ params }: { params: { id: string } }) {
  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <a href="/" className="hover:text-brand-600">Home</a>
        <span className="mx-2">/</span>
        <a href="/classes/MATH-P3-2026" className="hover:text-brand-600">Period 3 Math</a>
        <span className="mx-2">/</span>
        <span>Student: {params.id}</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6">Maria Santos</h1>

      {/* Top-3 Insights */}
      <h2 className="text-lg font-semibold mb-4">Top Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            icon: "🧠",
            title: "Strong in Fractions",
            desc: "Maria has mastered fraction operations (90% accuracy). Ready for advanced problems.",
            action: "Assign harder fraction challenges",
            color: "border-green-200 bg-green-50 dark:bg-green-900/10",
          },
          {
            icon: "⚡",
            title: "Fast Under Pressure",
            desc: "Avg response time 2.8s with 85% accuracy — fluent knowledge profile.",
            action: "Consider competition track",
            color: "border-blue-200 bg-blue-50 dark:bg-blue-900/10",
          },
          {
            icon: "🤝",
            title: "Healer Preference",
            desc: "Chooses healer role 70% of the time — strong prosocial orientation.",
            action: "Pair as peer tutor",
            color: "border-purple-200 bg-purple-50 dark:bg-purple-900/10",
          },
        ].map((insight) => (
          <div key={insight.title} className={`rounded-xl border p-4 ${insight.color}`}>
            <div className="text-2xl mb-2">{insight.icon}</div>
            <h3 className="font-semibold text-sm">{insight.title}</h3>
            <p className="text-xs text-gray-600 mt-1">{insight.desc}</p>
            <p className="text-xs text-brand-600 font-medium mt-2">{insight.action}</p>
          </div>
        ))}
      </div>

      {/* 6-Dimension Metrics */}
      <h2 className="text-lg font-semibold mb-4">Assessment Dimensions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { dim: "D1: Cognitive", value: "85%", detail: "Accuracy across 45 questions", bar: 85 },
          { dim: "D2: Engagement", value: "92%", detail: "8 sessions, 68 min total", bar: 92 },
          { dim: "D3: Strategic", value: "65%", detail: "Moderate action variation (0.6)", bar: 65 },
          { dim: "D4: Social", value: "78%", detail: "42 teammate interactions", bar: 78 },
          { dim: "D5: SEL", value: "88%", detail: "High persistence, low frustration", bar: 88 },
          { dim: "D6: Temporal", value: "72%", detail: "Improving trend (+0.12/session)", bar: 72 },
        ].map((d) => (
          <div key={d.dim} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{d.dim}</span>
              <span className="text-sm font-bold">{d.value}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 dark:bg-gray-800">
              <div
                className="bg-brand-500 h-2 rounded-full transition-all"
                style={{ width: `${d.bar}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{d.detail}</p>
          </div>
        ))}
      </div>

      {/* Session History */}
      <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
      <div className="space-y-2">
        {[
          { date: "Mar 6, 2:30 PM", game: "Pulse Realms", duration: "5:12", accuracy: "88%", role: "Healer" },
          { date: "Mar 5, 3:15 PM", game: "Pulse Realms", duration: "4:45", accuracy: "82%", role: "Attacker" },
          { date: "Mar 3, 2:00 PM", game: "Pulse Realms", duration: "5:00", accuracy: "80%", role: "Healer" },
        ].map((s, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-3 flex items-center justify-between dark:border-gray-800 dark:bg-gray-900">
            <div>
              <span className="text-sm font-medium">{s.game}</span>
              <span className="text-xs text-gray-500 ml-2">{s.date}</span>
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>{s.duration}</span>
              <span>{s.accuracy}</span>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded dark:bg-gray-800">{s.role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
