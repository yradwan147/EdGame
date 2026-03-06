export default function TeacherHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Welcome back, Teacher</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Students", value: "28", sub: "of 30 enrolled" },
          { label: "Sessions Today", value: "12", sub: "+3 from yesterday" },
          { label: "Avg Accuracy", value: "72%", sub: "across all classes" },
          { label: "Assignments Due", value: "2", sub: "this week" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Class List */}
      <h2 className="text-lg font-semibold mb-4">Your Classes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: "Period 3 Math", students: 30, code: "MATH-P3-2026" },
          { name: "Period 5 Science", students: 25, code: "SCI-P5-2026" },
        ].map((cls) => (
          <a
            key={cls.code}
            href={`/classes/${cls.code}`}
            className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-300 transition dark:border-gray-800 dark:bg-gray-900"
          >
            <h3 className="font-semibold">{cls.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {cls.students} students
            </p>
            <p className="text-xs text-gray-400 mt-2 font-mono">{cls.code}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
