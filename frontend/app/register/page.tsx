'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Settings = {
  logo_url?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(false);

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
        // Ignore and continue to register form.
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
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const firstError = data?.errors
          ? Object.values(data.errors).flat()[0]
          : data?.message;
        setError(typeof firstError === 'string' ? firstError : 'Registration failed');
        return;
      }

      if (data?.token) {
        window.localStorage.setItem('toolnavix_token', data.token);
      }

      router.push('/my-tools');
    } catch {
      setError('Unexpected error. Check network.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
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
          <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
          <p className="mt-2 text-sm text-slate-500">Save tools and access your personalized dashboard.</p>
        </div>

        {error && <p className="rounded-lg bg-rose-100 p-2 text-sm text-rose-700">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            value={form.name}
            type="text"
            placeholder="Full name"
            required
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
          />
          <input
            value={form.email}
            type="email"
            placeholder="Email"
            required
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
          />
          <input
            value={form.password}
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
          />
          <input
            value={form.password_confirmation}
            type="password"
            placeholder="Confirm password"
            required
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
