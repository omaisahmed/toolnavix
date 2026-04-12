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
  icon_alt?: string | null;
  icon_title?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
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
    icon_alt: '',
    icon_title: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

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
              icon_alt: found.icon_alt || '',
              icon_title: found.icon_title || '',
              meta_title: found.meta_title || '',
              meta_description: found.meta_description || '',
              meta_keywords: found.meta_keywords || '',
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
    setErrors({});
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };
      
      let response;
      if (categoryId) {
        response = await updateCategory(Number(categoryId), payload);
        toast.success('Category updated successfully.');
      } else {
        response = await createCategory(payload);
        toast.success('Category created successfully.');
      }
      // Store the new/updated item for immediate display on dashboard
      if (response) {
        sessionStorage.setItem('dashboardRefreshItem', JSON.stringify({
          type: 'category',
          data: response,
          timestamp: Date.now(),
        }));
      }
      router.push('/dashboard?tab=Categories');
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        toast.error('Please fix the validation errors below.');
      } else {
        toast.error(categoryId ? 'Failed to update category' : 'Failed to create category');
      }
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
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                tab === 'Categories' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
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

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">Category Information</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                  <input
                    type="text"
                    placeholder="Category name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                    required
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Slug</label>
                  <input
                    type="text"
                    placeholder="Leave empty to auto-generate"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 ${errors.slug ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                  />
                  {!form.slug && <p className="mt-1 text-xs text-slate-500">If empty, will auto-generate from name</p>}
                  {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug[0]}</p>}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Icon Class</label>
                <input
                  type="text"
                  placeholder="bi bi-robot"
                  value={form.icon ?? ''}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-slate-500">Recommended: Bootstrap Icons class, e.g. `bi bi-mic` or `bi bi-camera-video`.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">SEO Settings</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Icon Alt Text</label>
                  <input
                    type="text"
                    placeholder="Descriptive alt text for icon"
                    value={form.icon_alt}
                    onChange={(e) => setForm({ ...form, icon_alt: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 ${errors.icon_alt ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                  />
                  {errors.icon_alt && <p className="mt-1 text-sm text-red-600">{errors.icon_alt[0]}</p>}
                  <p className="mt-1 text-xs text-slate-500">Alt text for screen readers and SEO</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Icon Title</label>
                  <input
                    type="text"
                    placeholder="Tooltip text for icon"
                    value={form.icon_title}
                    onChange={(e) => setForm({ ...form, icon_title: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 ${errors.icon_title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                  />
                  {errors.icon_title && <p className="mt-1 text-sm text-red-600">{errors.icon_title[0]}</p>}
                  <p className="mt-1 text-xs text-slate-500">Title attribute for hover tooltip</p>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Meta Title</label>
                <input
                  type="text"
                  placeholder="Custom page title for SEO"
                  value={form.meta_title}
                  onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                  maxLength={60}
                  className={`w-full rounded-xl border px-4 py-3 ${errors.meta_title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                />
                {errors.meta_title && <p className="mt-1 text-sm text-red-600">{errors.meta_title[0]}</p>}
                <p className="mt-1 text-xs text-slate-500">{form.meta_title.length}/60 characters. Leave empty to use default.</p>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Meta Description</label>
                <textarea
                  placeholder="Brief description for search results"
                  value={form.meta_description}
                  onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                  maxLength={160}
                  rows={2}
                  className={`w-full rounded-xl border px-4 py-3 ${errors.meta_description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                />
                {errors.meta_description && <p className="mt-1 text-sm text-red-600">{errors.meta_description[0]}</p>}
                <p className="mt-1 text-xs text-slate-500">{form.meta_description.length}/160 characters. Leave empty to use default.</p>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Meta Keywords</label>
                <input
                  type="text"
                  placeholder="keyword1, keyword2, keyword3"
                  value={form.meta_keywords}
                  onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })}
                  className={`w-full rounded-xl border px-4 py-3 ${errors.meta_keywords ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                />
                {errors.meta_keywords && <p className="mt-1 text-sm text-red-600">{errors.meta_keywords[0]}</p>}
                <p className="mt-1 text-xs text-slate-500">Comma-separated keywords for SEO</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">Description</h2>
              <RichTextEditor
                value={form.description || ''}
                onChange={(nextValue) => setForm({ ...form, description: nextValue })}
                maxLength={3000}
                minHeightClassName="min-h-[140px]"
                placeholder="Write category description..."
                error={errors.description ? errors.description[0] : undefined}
              />
              <p className="mt-2 text-xs text-slate-500">Use this rich editor for category descriptions.</p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {categoryId ? 'Update Category' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard?tab=Categories')}
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

export default function CategoryFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen">Loading...</div>}>
      <CategoryFormContent />
    </Suspense>
  );
}
