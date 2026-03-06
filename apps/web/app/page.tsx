export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">EdGame</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Game-Based Learning Analytics Platform
      </p>
      <div className="flex gap-4">
        <a
          href="/api/health"
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
        >
          Health Check
        </a>
      </div>
    </main>
  );
}
