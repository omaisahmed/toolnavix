'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  title: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  children: ReactNode;
  settings: { logo_url?: string };
  onLogout: () => void;
}

export function DashboardLayout({
  title,
  breadcrumbs,
  children,
  settings,
  onLogout,
}: DashboardLayoutProps) {
  const router = useRouter();

  const tabs = ['Overview', 'Tools', 'Categories', 'Content', 'Users', 'Settings'];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen w-64 border-r border-slate-200 bg-white p-6 overflow-y-auto flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          {settings?.logo_url ? (
            <div className="h-10 overflow-hidden rounded-lg bg-white flex items-center justify-center">
              <img
                src={settings.logo_url}
                alt="Logo"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => router.push(`/dashboard?tab=${tab}`)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                tab === 'Overview'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="py-8 px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
              <span>Dashboard</span>
              {breadcrumbs?.map((crumb, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span>/</span>
                  {crumb.href ? (
                    <button
                      onClick={() => router.push(crumb.href!)}
                      className="text-indigo-600 hover:underline"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </div>
              ))}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
