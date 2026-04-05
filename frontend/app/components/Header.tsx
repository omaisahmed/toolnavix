'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';

type Settings = {
  logo_url?: string;
  favicon_url?: string;
};

export default function Header() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({});
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const pathname = usePathname();
  const currentPath = pathname ?? '';

  const navItems = [
    { href: '/browse-all', label: 'Browse All' },
    { href: '/featured-ai-tools', label: 'Featured AI Tools' },
    { href: '/categories', label: 'Categories' },
    { href: '/top-ai-tools', label: 'Top AI Tools' },
    { href: '/free-ai-tools', label: 'Free AI Tools' },
    { href: '/new-ai-tools', label: 'New AI Tools' },
    { href: '/compare', label: 'Compare Tools' },
    { href: '/guides', label: 'Guides' },
    { href: '/blog', label: 'Blog' },
    { href: '/ai-news', label: 'AI News' },
  ];

  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(Boolean(window.localStorage.getItem('toolnavix_token')));
    syncAuth();
    window.addEventListener('storage', syncAuth);

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

    return () => {
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const linkClass = (href: string) =>
    `text-sm font-medium transition ${currentPath === href || currentPath.startsWith(`${href}/`) ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`;

  const handleLogout = () => {
    window.localStorage.removeItem('toolnavix_token');
    setIsLoggedIn(false);
    setShowProfileMenu(false);
    router.push('/login');
  };

  return (
    <>
    <Toaster position="top-right" />
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
          <div className="hidden md:flex items-center gap-5">
            <nav className="flex items-center gap-5">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                  {item.label}
                </Link>
              ))}
              <Link href="/my-tools" className={linkClass('/my-tools')}>
                My Tools
              </Link>
            </nav>

            <div
              className="relative"
              onMouseEnter={() => isLoggedIn && setShowProfileMenu(true)}
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              {isLoggedIn ? (
                <>
                  <button
                    type="button"
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:border-indigo-300 hover:text-indigo-600 ${currentPath === '/my-tools' ? 'text-indigo-600' : 'text-slate-600'}`}
                    aria-label="Open profile menu"
                    title="Profile menu"
                  >
                    <i className="bi bi-person-circle text-xl" aria-hidden="true" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 top-full z-50 pt-2">
                      <div className="min-w-[160px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                        <Link
                          href="/my-tools"
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          My Tools
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-rose-600"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:border-indigo-300 hover:text-indigo-600 ${currentPath === '/login' ? 'text-indigo-600' : 'text-slate-600'}`}
                  aria-label="Go to login"
                  title="Login"
                >
                  <i className="bi bi-person-circle text-xl" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href={isLoggedIn ? '/my-tools' : '/login'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
              aria-label={isLoggedIn ? 'Open saved tools' : 'Go to login'}
              title={isLoggedIn ? 'Saved tools' : 'Login'}
            >
              <i className="bi bi-person-circle text-xl" aria-hidden="true" />
            </Link>
            <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-600 hover:text-slate-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden mt-4 space-y-3 pb-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`block ${linkClass(item.href)}`} onClick={() => setIsOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/my-tools" className={`block ${linkClass('/my-tools')}`} onClick={() => setIsOpen(false)}>
              My Tools
            </Link>
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="block text-sm font-medium text-slate-600 hover:text-rose-600"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className={`block ${linkClass('/login')}`}
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
    </>
  );
}
