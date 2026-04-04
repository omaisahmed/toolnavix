'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Settings = {
  logo_url?: string;
  favicon_url?: string;
};

export default function Header() {
  const [settings, setSettings] = useState<Settings>({});
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            {settings.logo_url ? (
              <div className="h-12 w-100 overflow-hidden rounded-lg bg-white flex items-center justify-center">
                <img src={settings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/tools" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Tools</Link>
            <Link href="/compare" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Compare</Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden mt-4 space-y-3 pb-4">
            <Link href="/tools" className="block text-slate-600 hover:text-slate-900 text-sm font-medium">Tools</Link>
            <Link href="/compare" className="block text-slate-600 hover:text-slate-900 text-sm font-medium">Compare</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
