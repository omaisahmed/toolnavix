'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/RichTextEditor';
import ImageUpload from '../../components/ImageUpload';
import { createPost, updatePost, fetchDashboardPosts, fetchSettings, fetchCategories } from '../../lib/api';

type Post = {
  id: number;
  title: string;
  slug: string;
  type: 'blog' | 'news' | 'guide';
  category?: string | null;
  tags?: string[];
  excerpt?: string | null;
  image?: string | null;
  image_alt?: string | null;
  image_title?: string | null;
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
  published: boolean;
  published_at?: string | null;
};

type Settings = {
  logo_url?: string;
};

function ContentFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams?.get('id');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(!!postId);
  const [categories, setCategories] = useState<any[]>([]);

  const handleLogout = () => {
    localStorage.removeItem('toolnavix_token');
    window.location.href = '/login';
  };

  const [categoryInput, setCategoryInput] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    slug: '',
    type: 'blog' as 'blog' | 'news' | 'guide',
    category: '',
    tags: '',
    excerpt: '',
    image: '',
    remove_image: false,
    image_alt: '',
    image_title: '',
    content: '',
    meta_title: '',
    meta_description: '',
    published: false,
  });
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const resolveCategoryId = (rawCategory?: string | null): string => {
    if (!rawCategory) return '';
    if (categories.length === 0) return '';

    const normalized = String(rawCategory).trim();
    if (!normalized) return '';

    const byId = categories.find((c) => String(c.id) === normalized);
    if (byId) return String(byId.id);

    const bySlug = categories.find((c) => String(c.slug || '').toLowerCase() === normalized.toLowerCase());
    if (bySlug) return String(bySlug.id);

    const byName = categories.find((c) => String(c.name || '').toLowerCase() === normalized.toLowerCase());
    if (byName) return String(byName.id);

    return '';
  };

  useEffect(() => {
    Promise.all([
      fetchSettings().then(s => setSettings(s)).catch(() => {}),
      fetchCategories().then(c => setCategories(c)).catch(() => {})
    ]);
  }, []);

  useEffect(() => {
    if (postId) {
      setIsLoadingData(true);
      const loadPost = async () => {
        try {
          const cacheBuster = Date.now();
          const posts = await fetchDashboardPosts({ per_page: '1000', '_t': String(cacheBuster) });
          const found = posts.data?.find((p) => String(p.id) === postId);
          if (found) {
            const selectedCategoryId = resolveCategoryId(found.category);
            const selectedCategory = categories.find((c) => String(c.id) === selectedCategoryId);
            setForm({
              title: found.title,
              slug: found.slug,
              type: found.type,
              category: selectedCategoryId,
              tags: typeof found.tags === 'string' ? found.tags : (Array.isArray(found.tags) ? found.tags.join(', ') : ''),
              excerpt: found.excerpt || '',
              image: found.image || '',
              remove_image: false,
              image_alt: found.image_alt || '',
              image_title: found.image_title || '',
              content: found.content || '',
              meta_title: found.meta_title || '',
              meta_description: found.meta_description || '',
              published: found.published,
            });
            if (selectedCategory) {
              setCategoryInput(selectedCategory.name);
            } else if (found.category) {
              setCategoryInput(found.category);
            }
          } else {
            toast.error('Post not found');
            router.push('/dashboard?tab=Content');
          }
        } catch (error) {
          toast.error('Failed to load post');
          router.push('/dashboard?tab=Content');
        } finally {
          setIsLoadingData(false);
        }
      };
      loadPost();
    }
  }, [postId, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const tagsArray = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      
      let payload: FormData | Record<string, unknown>;
      
      const useFormData = postImageFile || form.remove_image;
      if (useFormData) {
        payload = new FormData();
        payload.append('title', form.title);
        payload.append('slug', form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        payload.append('type', form.type);
        payload.append('category', form.category);
        payload.append('tags', JSON.stringify(tagsArray));
        payload.append('excerpt', form.excerpt);
        payload.append('content', form.content);
        payload.append('meta_title', form.meta_title);
        payload.append('meta_description', form.meta_description);
        payload.append('image_alt', form.image_alt || '');
        payload.append('image_title', form.image_title || '');
        payload.append('published', form.published ? '1' : '0');
        if (postImageFile) {
          payload.append('image', postImageFile);
        }
        if (form.remove_image) {
          payload.append('remove_image', '1');
        }
      } else {
        payload = {
          title: form.title,
          slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          type: form.type,
          category: form.category,
          tags: JSON.stringify(tagsArray),
          excerpt: form.excerpt,
          content: form.content,
          meta_title: form.meta_title,
          meta_description: form.meta_description,
          image_alt: form.image_alt || '',
          image_title: form.image_title || '',
          published: form.published,
        };
      }
      
      if (postId) {
        const response = await updatePost(Number(postId), payload);
        toast.success('Post updated successfully.');
        if (response) {
          sessionStorage.setItem('dashboardRefreshItem', JSON.stringify({
            type: 'post',
            data: response,
            timestamp: Date.now(),
          }));
        }
      } else {
        const response = await createPost(payload);
        toast.success('Post created successfully.');
        if (response) {
          sessionStorage.setItem('dashboardRefreshItem', JSON.stringify({
            type: 'post',
            data: response,
            timestamp: Date.now(),
          }));
        }
      }
      router.push('/dashboard?tab=Content');
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        toast.error('Please fix the validation errors below.');
      } else {
        toast.error(postId ? 'Failed to update post' : 'Failed to create post');
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
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === 'Content' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
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
              <span>Content</span>
              {postId && (
                <>
                  <span>/</span>
                  <span>{postId ? 'Edit' : 'Create'}</span>
                </>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{postId ? 'Edit Post' : 'Create New Post'}</h1>
            <p className="text-slate-600 mt-2">Fill in the details below to {postId ? 'update' : 'create'} your post</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">Post Information</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                  <input
                    type="text"
                    placeholder="Title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                    required
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title[0]}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as 'blog' | 'news' })}
                    className={`w-full rounded-xl border px-4 py-3 ${errors.type ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                  >
                    <option value="blog">Blog</option>
                    <option value="news">AI News</option>
                  </select>
                  {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type[0]}</p>}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Slug</label>
                  <input
                    type="text"
                    placeholder="Leave empty to auto-generate"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 ${errors.slug ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                  />
                  {!form.slug && <p className="mt-1 text-xs text-slate-500">If empty, will auto-generate from title</p>}
                  {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug[0]}</p>}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                  <input
                    type="text"
                    value={categoryInput || categories.find((c) => c.id === Number(form.category))?.name || ''}
                    onChange={(e) => {
                      setForm({ ...form, category: '' });
                      setCategoryInput(e.target.value);
                      setCategoryDropdownOpen(true);
                    }}
                    onFocus={() => setCategoryDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setCategoryDropdownOpen(false), 120)}
                    placeholder="Search category..."
                    className={`w-full rounded-xl border px-4 py-3 ${errors.category ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                    autoComplete="off"
                    required
                  />
                  {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category[0]}</p>}
                  {categoryDropdownOpen && (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {categories.filter((c) => c.name.toLowerCase().includes(categoryInput.toLowerCase())).length > 0 ? (
                        categories.filter((c) => c.name.toLowerCase().includes(categoryInput.toLowerCase())).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setForm({ ...form, category: String(c.id) });
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Tags (comma-separated)"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 ${errors.tags ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                  />
                  {errors.tags && <p className="mt-1 text-sm text-red-600">{errors.tags[0]}</p>}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  placeholder="Description"
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className={`w-full rounded-xl border px-4 py-3 ${errors.excerpt ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                  rows={3}
                />
                {errors.excerpt && <p className="mt-1 text-sm text-red-600">{errors.excerpt[0]}</p>}
              </div>
              <div className="mt-6">
                <label className="text-sm font-medium text-slate-700 mb-2">Post Image</label>
                <div className="mt-2">
                  <ImageUpload
                    currentImage={form.image}
                    onImageSelect={(file) => {
                      setPostImageFile(file);
                      setForm({ ...form, remove_image: false });
                    }}
                    onImageRemove={() => {
                      setPostImageFile(null);
                      setForm({ ...form, image: '', remove_image: true });
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Recommended ratio: 16:9, max size 10MB.</p>
              </div>

              <div className="mt-6">
                <label className="text-sm font-medium text-slate-700 mb-2">Image SEO</label>
                <div className="grid gap-4 sm:grid-cols-2 mt-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2">Image Alt Text</label>
                    <input
                      type="text"
                      placeholder="Descriptive alt text for image"
                      value={form.image_alt}
                      onChange={(e) => setForm({ ...form, image_alt: e.target.value })}
                      className={`w-full rounded-xl border px-4 py-3 ${errors.image_alt ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                    />
                    <p className="mt-1 text-xs text-slate-500">Alt text for screen readers and SEO</p>
                    {errors.image_alt && <p className="mt-1 text-sm text-red-600">{errors.image_alt[0]}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2">Image Title</label>
                    <input
                      type="text"
                      placeholder="Tooltip text for image"
                      value={form.image_title}
                      onChange={(e) => setForm({ ...form, image_title: e.target.value })}
                      className={`w-full rounded-xl border px-4 py-3 ${errors.image_title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                    />
                    <p className="mt-1 text-xs text-slate-500">Title attribute for hover tooltip</p>
                    {errors.image_title && <p className="mt-1 text-sm text-red-600">{errors.image_title[0]}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">Content</h2>
              <RichTextEditor value={form.content} onChange={(content) => setForm({ ...form, content })} error={errors.content ? errors.content[0] : undefined} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">SEO Settings</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Meta Title</label>
                  <input
                    type="text"
                    placeholder="Meta Title"
                    value={form.meta_title}
                    onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 ${errors.meta_title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                  />
                  {errors.meta_title && <p className="mt-1 text-sm text-red-600">{errors.meta_title[0]}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Meta Description</label>
                  <input
                    type="text"
                    placeholder="Meta Description"
                    value={form.meta_description}
                    onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 ${errors.meta_description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`}
                  />
                  {errors.meta_description && <p className="mt-1 text-sm text-red-600">{errors.meta_description[0]}</p>}
                </div>
              </div>
              <div className="mt-6">
                <label className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-slate-700">Publish this post</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all">
                {submitting ? 'Saving...' : postId ? 'Update Post' : 'Create Post'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard?tab=Content')}
                className="px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all"
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

export default function ContentFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen">Loading...</div>}>
      <ContentFormContent />
    </Suspense>
  );
}
