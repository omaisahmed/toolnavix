'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Settings = {
  logo_url?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch {
        // ignore branding fetch errors
      }
    };

    const validateExistingSession = async () => {
      const token = window.localStorage.getItem('toolnavix_token');
      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          router.replace('/my-tools');
          return;
        }
      } catch {
        // Ignore and continue to login form.
      }

      window.localStorage.removeItem('toolnavix_token');
      setCheckingSession(false);
    };

    fetchSettings();
    validateExistingSession();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.message || 'Login failed');
        return;
      }

      const data = await res.json();
      window.localStorage.setItem('toolnavix_token', data.token);
      router.push('/my-tools');
    } catch (err) {
      setError('Unexpected error. Check network.');
    }
  };

  if (checkingSession) {
    return null;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_42%),linear-gradient(to_bottom,_#f8fafc,_#ffffff)] px-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-50/80 to-transparent" />
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-200/60 backdrop-blur">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" className="mb-4 inline-flex items-center justify-center">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="ToolNavix" className="max-h-14 max-w-[220px] object-contain" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <i className="bi bi-grid-1x2-fill text-lg" aria-hidden="true" />
              </div>
            )}
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">AI Search Directory Engine</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Login</h1>
          <p className="mt-2 text-sm text-slate-500">Access your saved AI stack and personalized discovery workspace.</p>
        </div>

        {error && <p className="rounded-lg bg-rose-100 p-2 text-sm text-rose-700">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input value={form.email} type="email" placeholder="Email" required onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          <input value={form.password} type="password" placeholder="Password" required onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          <button type="submit" className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">Log In</button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
