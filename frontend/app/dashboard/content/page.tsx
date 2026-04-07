'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/RichTextEditor';
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
    content: '',
    meta_title: '',
    meta_description: '',
    published: false,
  });
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

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
            setForm({
              title: found.title,
              slug: found.slug,
              type: found.type,
              category: found.category || '',
              tags: typeof found.tags === 'string' ? found.tags : (Array.isArray(found.tags) ? found.tags.join(', ') : ''),
              excerpt: found.excerpt || '',
              image: found.image || '',
              content: found.content,
              meta_title: found.meta_title || '',
              meta_description: found.meta_description || '',
              published: found.published,
            });
            if (found.category) {
              const cat = categories.find((c) => String(c.id) === String(found.category));
              setCategoryInput(cat?.name || '');
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
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tagsArray = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      
      let payload: FormData | Record<string, unknown>;
      
      if (postImageFile) {
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
        payload.append('published', form.published ? '1' : '0');
        payload.append('image', postImageFile);
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
          published: form.published,
        };
      }
      
      if (postId) {
        await updatePost(Number(postId), payload);
        toast.success('Post updated successfully.');
      } else {
        await createPost(payload);
        toast.success('Post created successfully.');
      }
      router.push('/dashboard?tab=Content');
    } catch (error) {
      toast.error(postId ? 'Failed to update post' : 'Failed to create post');
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
                tab === 'Content' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
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

          {isLoadingData && (
            <div className="mb-6 flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-8">
              <div className="text-center">
                <div className="mb-3 inline-block h-6 w-6 animate-spin rounded-full border-3 border-slate-200 border-t-indigo-600"></div>
                <p className="text-sm text-slate-600">Loading post data...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8" style={{ display: isLoadingData ? 'none' : 'block' }}>
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as 'blog' | 'news' })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <option value="blog">Blog</option>
                    <option value="news">AI News</option>
                  </select>
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  />
                  {!form.slug && <p className="mt-1 text-xs text-slate-500">If empty, will auto-generate from title</p>}
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Excerpt</label>
                <textarea
                  placeholder="Excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  rows={3}
                />
              </div>
              <div className="mt-6">
                <label className="text-sm font-medium text-slate-700">Post Image</label>
                <div className="mt-2 flex items-center gap-4">
                  {form.image && !postImageFile && (
                    <div className="h-16 w-24 overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <img src={form.image} alt="Post preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                  {postImageFile && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      {postImageFile.name}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setPostImageFile(file);
                    }}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Recommended ratio: 16:9, max size 10MB.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">Content</h2>
              <RichTextEditor value={form.content} onChange={(content) => setForm({ ...form, content })} />
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Meta Description</label>
                  <input
                    type="text"
                    placeholder="Meta Description"
                    value={form.meta_description}
                    onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  />
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

            <div className="flex gap-3 pt-8 pb-8">
              <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all">
                {loading ? 'Saving...' : postId ? 'Update Post' : 'Create Post'}
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
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
          <p className="text-sm text-slate-600">Loading form...</p>
        </div>
      </div>
    }>
      <ContentFormContent />
    </Suspense>
  );
}
