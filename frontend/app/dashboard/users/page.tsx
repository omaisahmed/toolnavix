'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { createUser, updateUser, fetchDashboardUsers, fetchSettings } from '../../lib/api';

type User = {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  banned: boolean;
  created_at: string;
};

type Settings = {
  logo_url?: string;
};

function UserFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams?.get('id');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(!!userId);

  const handleLogout = () => {
    localStorage.removeItem('toolnavix_token');
    window.location.href = '/login';
  };

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSettings().then(s => setSettings(s)).catch(() => { });
  }, []);

  useEffect(() => {
    if (userId) {
      setIsLoadingData(true);
      const loadUser = async () => {
        try {
          const users = await fetchDashboardUsers();
          const found = users.find((u) => String(u.id) === userId);
          if (found) {
            setForm({
              name: found.name,
              email: found.email,
              password: '',
            });
          } else {
            toast.error('User not found');
            router.push('/dashboard?tab=Users');
          }
        } catch (error) {
          toast.error('Failed to load user');
          router.push('/dashboard?tab=Users');
        } finally {
          setIsLoadingData(false);
        }
      };
      loadUser();
    }
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = userId ?
        { name: form.name, email: form.email, ...(form.password && { password: form.password }) } :
        form;

      let response;
      if (userId) {
        response = await updateUser(Number(userId), payload);
        toast.success('User updated successfully.');
      } else {
        response = await createUser(payload);
        toast.success('User created successfully.');
      }
      // Store the new/updated item for immediate display on dashboard
      if (response) {
        sessionStorage.setItem('dashboardRefreshItem', JSON.stringify({
          type: 'user',
          data: response,
          timestamp: Date.now(),
        }));
      }
      router.push('/dashboard?tab=Users');
    } catch (error) {
      toast.error(userId ? 'Failed to update user' : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 h-screen w-64 border-r border-slate-200 bg-white p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          {settings?.logo_url ? (
            <div className="h-10 overflow-hidden rounded-lg bg-white flex items-center justify-center">
              <img src={settings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
        </div>
        <nav className="space-y-2">
          {['Overview', 'Tools', 'Categories', 'Content', 'Users', 'Settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => router.push(`/dashboard?tab=${tab}`)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${tab === 'Users' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="py-8 px-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
              <span>Dashboard</span>
              <span>/</span>
              <span>Users</span>
              {userId && (
                <>
                  <span>/</span>
                  <span>{userId ? 'Edit' : 'Create'}</span>
                </>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{userId ? 'Edit User' : 'Create New User'}</h1>
            <p className="text-slate-600 mt-2">Fill in the details below to {userId ? 'update' : 'create'} a user account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">User Information</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {!userId && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {userId ? 'Update User' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard?tab=Users')}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function UserFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen">Loading...</div>}>
      <UserFormContent />
    </Suspense>
  );
}
