'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/RichTextEditor';
import { createCategory, updateCategory, fetchCategories, fetchSettings } from '../../lib/api';

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
};

type Settings = {
  logo_url?: string;
};

function CategoryFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams?.get('id');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(!!categoryId);
  
  const handleLogout = () => {
    localStorage.removeItem('toolnavix_token');
    window.location.href = '/login';
  };

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings().then(s => setSettings(s)).catch(() => {});
  }, []);

  useEffect(() => {
    if (categoryId) {
      setIsLoadingData(true);
      const loadCategory = async () => {
        try {
          const categories = await fetchCategories();
          const found = categories.find((c) => String(c.id) === categoryId);
          if (found) {
            setForm({
              name: found.name,
              slug: found.slug,
              description: found.description || '',
              icon: found.icon || '',
            });
          } else {
            toast.error('Category not found');
            router.push('/dashboard?tab=Categories');
          }
        } catch (error) {
          toast.error('Failed to load category');
          router.push('/dashboard?tab=Categories');
        } finally {
          setIsLoadingData(false);
        }
      };
      loadCategory();
    }
  }, [categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };
      
      if (categoryId) {
        await updateCategory(Number(categoryId), payload);
        toast.success('Category updated successfully.');
      } else {
        await createCategory(payload);
        toast.success('Category created successfully.');
      }
      router.push('/dashboard?tab=Categories');
    } catch (error) {
      toast.error(categoryId ? 'Failed to update category' : 'Failed to create category');
    } finally {
      setLoading(false);
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
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === 'Categories' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
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
              <span>Categories</span>
              {categoryId && (
                <>
                  <span>/</span>
                  <span>{categoryId ? 'Edit' : 'Create'}</span>
                </>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{categoryId ? 'Edit Category' : 'Create New Category'}</h1>
            <p className="text-slate-600 mt-2">Fill in the details below to {categoryId ? 'update' : 'create'} your category</p>
          </div>

          {isLoadingData && (
            <div className="mb-6 flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-8">
              <div className="text-center">
                <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-3 border-slate-200 border-t-indigo-600"></div>
                <p className="text-sm text-slate-600">Loading category data...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" style={{ display: isLoadingData ? 'none' : 'block' }}>
            <div>
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Leave empty to auto-generate" />
              {!form.slug && <p className="mt-1 text-xs text-slate-500">If empty, will auto-generate from name</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Icon Class</label>
              <input
                value={form.icon ?? ''}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="bi bi-robot"
              />
              <p className="mt-1 text-xs text-slate-500">Recommended: Bootstrap Icons class, e.g. `bi bi-mic` or `bi bi-camera-video`.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Description Editor</label>
              <div className="mt-3">
                <RichTextEditor
                  value={form.description || ''}
                  onChange={(nextValue) => setForm({ ...form, description: nextValue })}
                  maxLength={3000}
                  minHeightClassName="min-h-[140px]"
                  placeholder="Write category description..."
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Use this rich editor for category descriptions.</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => router.push('/dashboard?tab=Categories')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={loading} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {categoryId ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function CategoryFormPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
          <p className="text-sm text-slate-600">Loading form...</p>
        </div>
      </div>
    }>
      <CategoryFormContent />
    </Suspense>
  );
}
