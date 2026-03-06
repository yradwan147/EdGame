"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/classes", label: "Classes", icon: "📚" },
  { href: "/assignments/new", label: "New Assignment", icon: "📝" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-brand-600">EdGame</h1>
          <p className="text-xs text-gray-500 mt-1">Teacher Dashboard</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-700 font-medium dark:bg-brand-900/20 dark:text-brand-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-sm font-medium text-brand-700">
              T
            </div>
            <div className="text-sm">
              <p className="font-medium">Teacher</p>
              <p className="text-gray-500 text-xs">teacher@demo.edgame.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
