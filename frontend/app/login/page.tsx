'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
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
          router.replace('/dashboard');
          return;
        }
      } catch {
        // Ignore and continue to login form.
      }

      window.localStorage.removeItem('toolnavix_token');
      setCheckingSession(false);
    };

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
      router.push('/dashboard');
    } catch (err) {
      setError('Unexpected error. Check network.');
    }
  };

  if (checkingSession) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Login</h1>
        {error && <p className="mt-3 rounded-lg bg-rose-100 p-2 text-sm text-rose-700">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input value={form.email} type="email" placeholder="Email" required onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-3" />
          <input value={form.password} type="password" placeholder="Password" required onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-3" />
          <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Log In</button>
        </form>
        {/* <p className="mt-4 text-sm text-slate-600">No account? <a href="/register" className="text-indigo-600 hover:underline">Register</a></p> */}
      </div>
    </main>
  );
}
