"use client";

export default function NewAssignment() {
  return (
    <div className="max-w-2xl">
      <nav className="text-sm text-gray-500 mb-4">
        <a href="/" className="hover:text-brand-600">Home</a>
        <span className="mx-2">/</span>
        <span>New Assignment</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6">Create Assignment</h1>

      <form className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            placeholder="e.g. Fractions Practice — Week 2"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Game Environment</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
            <option value="pulse-realms">Pulse Realms — Team Arena</option>
            <option value="concept-cascade" disabled>Concept Cascade — Tower Defense (coming soon)</option>
            <option value="lab-explorer" disabled>Lab Explorer — Virtual Science Lab (coming soon)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Assign to Class</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
            <option value="">Select a class...</option>
            <option value="math-p3">Period 3 Math (30 students)</option>
            <option value="sci-p5">Period 5 Science (25 students)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject Focus</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
              <option value="math">Math</option>
              <option value="science">Science</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
              <option value="1">1 — Easy</option>
              <option value="2">2 — Below Average</option>
              <option value="3">3 — Average</option>
              <option value="4">4 — Above Average</option>
              <option value="5">5 — Hard</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Instructions</label>
          <textarea
            rows={3}
            placeholder="e.g. Complete at least 3 matches to practice fractions."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="datetime-local"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition font-medium text-sm"
        >
          Create Assignment
        </button>
      </form>
    </div>
  );
}
