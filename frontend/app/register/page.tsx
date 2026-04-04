'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.errors ? Object.values(body.errors).flat().join(', ') : body.message || 'Registration failed');
        return;
      }

      const data = await res.json();
      window.localStorage.setItem('toolnavix_token', data.token);
      router.push('/dashboard');
    } catch (err) {
      setError('Unexpected error.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Register</h1>
        {error && <p className="mt-3 rounded-lg bg-rose-100 p-2 text-sm text-rose-700">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input value={form.name} type="text" placeholder="Name" required onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-3" />
          <input value={form.email} type="email" placeholder="Email" required onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-3" />
          <input value={form.password} type="password" placeholder="Password" required onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-3" />
          <input value={form.password_confirmation} type="password" placeholder="Confirm Password" required onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} className="w-full rounded-lg border border-slate-300 px-4 py-3" />
          <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Create Account</button>
        </form>
        <p className="mt-4 text-sm text-slate-600">Already registered? <a href="/login" className="text-indigo-600 hover:underline">Login</a></p>
      </div>
    </main>
  );
}
