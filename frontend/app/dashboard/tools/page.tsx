'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/RichTextEditor';
import { createTool, updateTool, fetchTools, fetchSettings, fetchCategories } from '../../lib/api';

type Tool = {
  id: number;
  name: string;
  slug: string;
  description: string;
  pricing: string;
  rating: number;
  category: { id: number; name: string };
  featured: boolean;
  trending: boolean;
  just_landed: boolean;
  is_top?: boolean;
  visit_url: string;
  logo?: string | null;
  features?: string[];
  pros?: string[];
  cons?: string[];
};

type Settings = {
  logo_url?: string;
};

function ToolFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toolId = searchParams?.get('id');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const handleLogout = () => {
    localStorage.removeItem('toolnavix_token');
    window.location.href = '/login';
  };

  const [tool, setTool] = useState<Tool | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(!!toolId);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    pricing: 'freemium',
    rating: '4.5',
    category_id: '',
    visit_url: '',
    featured: false,
    trending: false,
    just_landed: false,
    is_top: false,
    logo: '',
    remove_logo: false,
    features: '',
    pros: '',
    cons: '',
  });
  const [loading, setLoading] = useState(false);
  const [toolImageFile, setToolImageFile] = useState<File | null>(null);
  const [categoryInput, setCategoryInput] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    Promise.all([
      fetchSettings().then(s => setSettings(s)).catch(() => {}),
      fetchCategories().then(c => setCategories(c)).catch(() => {})
    ]);
  }, []);

  useEffect(() => {
    if (toolId) {
      setIsLoadingData(true);
      const loadTool = async () => {
        try {
          console.log('Loading tool with ID:', toolId);
          // Add timestamp to bust cache
          const cacheBuster = Date.now();
          const tools = await fetchTools({ per_page: '1000', '_t': String(cacheBuster) });
          console.log('Fetched tools:', tools);
          const foundTool = tools.data?.find((t) => String(t.id) === toolId);
          console.log('Found tool:', foundTool);
          if (foundTool) {
            console.log('Setting form with tool:', foundTool);
            setTool(foundTool);
            setForm({
              name: foundTool.name,
              slug: foundTool.slug,
              description: foundTool.description,
              pricing: foundTool.pricing,
              rating: String(foundTool.rating),
              category_id: String(foundTool.category.id),
              visit_url: foundTool.visit_url,
              featured: foundTool.featured,
              trending: foundTool.trending,
              just_landed: foundTool.just_landed,
              is_top: foundTool.is_top || false,
              logo: foundTool.logo || '',
              remove_logo: false,
              features: typeof foundTool.features === 'string' ? (JSON.parse(foundTool.features || '[]') || []).join(', ') : (foundTool.features || []).join(', '),
              pros: typeof foundTool.pros === 'string' ? (JSON.parse(foundTool.pros || '[]') || []).join(', ') : (foundTool.pros || []).join(', '),
              cons: typeof foundTool.cons === 'string' ? (JSON.parse(foundTool.cons || '[]') || []).join(', ') : (foundTool.cons || []).join(', '),
            });
            setCategoryInput(foundTool.category.name);
          } else {
            console.error('Tool not found in response. toolId:', toolId, 'tools.data:', tools.data?.map(t => ({ id: t.id, name: t.name })));
            toast.error('Tool not found');
            router.push('/dashboard?tab=Tools');
          }
        } catch (error) {
          console.error('Error loading tool:', error);
          toast.error('Failed to load tool');
          router.push('/dashboard?tab=Tools');
        } finally {
          setIsLoadingData(false);
        }
      };
      loadTool();
    }
  }, [toolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const featuresArray = form.features.split(',').map((f) => f.trim()).filter(Boolean);
      const prosArray = form.pros.split(',').map((p) => p.trim()).filter(Boolean);
      const consArray = form.cons.split(',').map((c) => c.trim()).filter(Boolean);

      // Use FormData if there's a file to upload or logo to remove
      let payload: FormData | Record<string, unknown>;
      
      if (toolImageFile || form.remove_logo) {
        payload = new FormData();
        payload.append('name', form.name);
        payload.append('slug', form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        payload.append('description', form.description);
        payload.append('pricing', form.pricing);
        payload.append('rating', String(parseFloat(form.rating)));
        payload.append('category_id', String(Number(form.category_id)));
        if (form.visit_url.trim()) {
          payload.append('visit_url', form.visit_url);
        }
        // Send booleans as 1 or 0 for FormData compatibility with Laravel
        payload.append('featured', form.featured ? '1' : '0');
        payload.append('trending', form.trending ? '1' : '0');
        payload.append('just_landed', form.just_landed ? '1' : '0');
        payload.append('is_top', form.is_top ? '1' : '0');
        payload.append('features', JSON.stringify(featuresArray));
        payload.append('pros', JSON.stringify(prosArray));
        payload.append('cons', JSON.stringify(consArray));
        if (form.remove_logo) {
          payload.append('remove_logo', '1');
        }
        if (toolImageFile) {
          payload.append('logo', toolImageFile);
        }
      } else {
        payload = {
          name: form.name,
          slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: form.description,
          pricing: form.pricing,
          rating: parseFloat(form.rating),
          category_id: Number(form.category_id),
          featured: form.featured,
          trending: form.trending,
          just_landed: form.just_landed,
          is_top: form.is_top,
          features: JSON.stringify(featuresArray),
          pros: JSON.stringify(prosArray),
          cons: JSON.stringify(consArray),
        };
        if (form.visit_url.trim()) {
          payload.visit_url = form.visit_url;
        }
      }

      if (toolId) {
        await updateTool(Number(toolId), payload);
        toast.success('Tool updated successfully.');
      } else {
        await createTool(payload);
        toast.success('Tool created successfully.');
      }
      router.push('/dashboard?tab=Tools');
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        toast.error('Please fix the validation errors below.');
      } else {
        toast.error(toolId ? 'Failed to update tool' : 'Failed to create tool');
      }
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
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                tab === 'Tools' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
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
              <span>Tools</span>
              {toolId && (
                <>
                  <span>/</span>
                  <span>{toolId ? 'Edit' : 'Create'}</span>
                </>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{toolId ? 'Edit Tool' : 'Create New Tool'}</h1>
            <p className="text-slate-600 mt-2">Fill in the details below to {toolId ? 'update' : 'create'} your tool</p>
          </div>

          {isLoadingData && (
            <div className="mb-6 flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-8">
              <div className="text-center">
                <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-3 border-slate-200 border-t-indigo-600"></div>
                <p className="text-sm text-slate-600">Loading tool data...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8" style={{ display: isLoadingData ? 'none' : 'block' }}>
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">Basic Information</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                  <input
                    type="text"
                    placeholder="Tool name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Slug</label>
                  <input
                    type="text"
                    placeholder="Leave empty to auto-generate"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  {!form.slug && <p className="mt-1 text-xs text-slate-500">If empty, will auto-generate from name</p>}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={categoryInput || categories.find((c) => c.id === Number(form.category_id))?.name || ''}
                    onChange={(e) => {
                      setForm({ ...form, category_id: '' });
                      setCategoryInput(e.target.value);
                      setCategoryDropdownOpen(true);
                    }}
                    onFocus={() => setCategoryDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setCategoryDropdownOpen(false), 120)}
                    placeholder="Search category..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    autoComplete="off"
                    required
                  />
                  {categoryDropdownOpen && (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {categories.filter((c) => c.name.toLowerCase().includes(categoryInput.toLowerCase())).length > 0 ? (
                        categories.filter((c) => c.name.toLowerCase().includes(categoryInput.toLowerCase())).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setForm({ ...form, category_id: String(c.id) });
                              setCategoryInput(c.name);
                              setCategoryDropdownOpen(false);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {c.name}
                          </button>
                        ))
                      ) : (
                        <p className="px-4 py-2 text-xs text-slate-500">No matching categories</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">Tool Details</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pricing</label>
                  <select
                    value={form.pricing}
                    onChange={(e) => setForm({ ...form, pricing: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                    <option value="freemium">Freemium</option>
                    <option value="free_trial">Free trial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="4.5"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Visit URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={form.visit_url}
                    onChange={(e) => setForm({ ...form, visit_url: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Tool Image</label>
                <div className="flex items-center gap-4">
                  {form.logo && !toolImageFile && (
                    <div className="h-16 w-24 overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <img src={form.logo} alt={`${form.name} preview`} className="h-full w-full object-cover" />
                    </div>
                  )}
                  {toolImageFile && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      {toolImageFile.name}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setToolImageFile(file);
                      if (file) {
                        setForm({ ...form, remove_logo: false });
                      }
                    }}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {form.logo && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, logo: '', remove_logo: true });
                      setToolImageFile(null);
                    }}
                    className="mt-2 text-sm text-rose-600 hover:underline"
                  >
                    Remove current image
                  </button>
                )}
                <p className="mt-1 text-xs text-slate-500">Recommended ratio: 16:9, max size 10MB.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">Description</h2>
              <RichTextEditor
                value={form.description || ''}
                onChange={(nextValue) => setForm({ ...form, description: nextValue })}
                minHeightClassName="min-h-[180px]"
                placeholder="Write a detailed tool description..."
              />
              <p className="mt-2 text-xs text-slate-500">Use this rich editor. Formatted description will render properly on the website.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">Features & Attributes</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Features (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Feature 1, Feature 2, Feature 3"
                    value={form.features}
                    onChange={(e) => setForm({ ...form, features: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${errors.features ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  />
                  {errors.features && <p className="mt-1 text-xs text-red-600">{errors.features[0]}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pros (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Pro 1, Pro 2, Pro 3"
                    value={form.pros}
                    onChange={(e) => setForm({ ...form, pros: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${errors.pros ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  />
                  {errors.pros && <p className="mt-1 text-xs text-red-600">{errors.pros[0]}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cons (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Con 1, Con 2, Con 3"
                    value={form.cons}
                    onChange={(e) => setForm({ ...form, cons: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${errors.cons ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  />
                  {errors.cons && <p className="mt-1 text-xs text-red-600">{errors.cons[0]}</p>}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-4">Tool Status</label>
                <div className="grid gap-3 sm:grid-cols-4">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">Featured</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.trending}
                      onChange={(e) => setForm({ ...form, trending: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">Trending</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.just_landed}
                      onChange={(e) => setForm({ ...form, just_landed: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">Just Landed</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_top}
                      onChange={(e) => setForm({ ...form, is_top: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">Top AI</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {toolId ? 'Update Tool' : 'Create Tool'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard?tab=Tools')}
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

export default function ToolFormPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
          <p className="text-sm text-slate-600">Loading form...</p>
        </div>
      </div>
    }>
      <ToolFormContent />
    </Suspense>
  );
}
