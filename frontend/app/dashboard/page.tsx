'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import RichTextEditor from '../components/RichTextEditor';
import { stripHtml } from '../lib/richText';
import {
  createCategory,
  createTool,
  createUser,
  deleteCategory,
  deleteReview,
  deleteTool,
  fetchCategories,
  fetchDashboardReviews,
  fetchDashboardStats,
  fetchDashboardUsers,
  fetchTools,
  fetchDashboardPosts,
  approveReview,
  banUser,
  createPost,
  deletePost,
  updateCategory,
  updatePost,
  updateTool,
  updateUser,
  fetchSettings,
  updateSettings,
} from '../lib/api';

const tabs = ['Overview', 'Tools', 'Categories', 'Content', 'Users', 'Reviews', 'Settings'] as const;
type Tab = (typeof tabs)[number];

type Stats = {
  total_tools: number;
  total_users: number;
  total_views: number;
  trending_tools: Array<{ id: number; name: string }>;
  featured_tools: Array<{ id: number; name: string }>;
  new_tools: Array<{ id: number; name: string }>;
};

type Tool = {
  id: number;
  name: string;
  slug: string;
  description: string;
  pricing: string;
  rating: number;
  category: { id: number; name: string; slug: string };
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

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
};

type User = {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  banned: boolean;
  created_at: string;
};

type Review = {
  id: number;
  comment: string;
  approved: boolean;
  created_at: string;
  user: { id: number; name: string };
  tool: { id: number; name: string };
};

const defaultToolForm = {
  name: '',
  slug: '',
  description: '',
  category_id: '',
  pricing: 'freemium',
  rating: '4.5',
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
};

const defaultPostForm = {
  title: '',
  slug: '',
  type: 'blog',
  category: '',
  tags: '',
  excerpt: '',
  image: '',
  remove_image: false,
  content: '',
  meta_title: '',
  meta_description: '',
  published: true,
  published_at: '',
};

const defaultCategoryForm = {
  name: '',
  slug: '',
  description: '',
  icon: '',
};

const defaultUserForm = {
  name: '',
  email: '',
  password: '',
};

const TOOL_DESCRIPTION_MAX = 5000;
const CATEGORY_DESCRIPTION_MAX = 3000;

type ModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
};

type FormModalState = {
  isOpen: boolean;
  type: 'tool' | 'category' | 'user' | null;
  mode: 'create' | 'edit';
  data?: any;
};

type Settings = {
  logo_url?: string;
  favicon_url?: string;
  footer_text?: string | null;
  hero_badge?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_search_placeholder?: string | null;
  hero_search_button_text?: string | null;
  hero_tag_1?: string | null;
  hero_tag_2?: string | null;
  hero_tag_3?: string | null;
};

const Modal = ({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-2xl bg-white p-6 shadow-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-4 flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">Delete</button>
        </div>
      </div>
    </div>
  );
};

const FormModal = ({ isOpen, type, mode, data, onClose, onSubmit, formData, setFormData, loading, toolImageFile, setToolImageFile }: {
  isOpen: boolean;
  type: 'tool' | 'category' | 'user' | null;
  mode: 'create' | 'edit';
  data?: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  loading: boolean;
  toolImageFile: File | null;
  setToolImageFile: (file: File | null) => void;
}) => {
  if (!isOpen || !type) return null;

  const title = mode === 'create' ? `Create ${type === 'tool' ? 'Tool' : type === 'category' ? 'Category' : 'User'}` : `Edit ${type === 'tool' ? 'Tool' : type === 'category' ? 'Category' : 'User'}`;
  const descriptionEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const insertDescriptionLine = (_line: string) => {};
  const insertDescriptionText = (_before: string, _after = '', _placeholder = '') => {};

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button onClick={onClose} className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700">
              Close
            </button>
          </div>
        </div>
        <div className="p-6">
          {type === 'tool' && (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Slug</label>
                  <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Leave empty to auto-generate" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" required>
                  <option value="">Select category</option>
                  {data?.categories?.map((category: any) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Pricing</label>
                  <select value={formData.pricing} onChange={(e) => setFormData({ ...formData, pricing: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2">
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                    <option value="freemium">Freemium</option>
                    <option value="free_trial">Free trial</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Rating</label>
                  <input type="number" step="0.1" min="0" max="5" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Visit URL</label>
                  <input value={formData.visit_url} onChange={(e) => setFormData({ ...formData, visit_url: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Tool Image</label>
                <div className="mt-2 flex items-center gap-4">
                  {formData.logo && !toolImageFile && (
                    <div className="h-16 w-24 overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <img src={formData.logo} alt={`${formData.name} preview`} className="h-full w-full object-cover" />
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
                        setFormData({ ...formData, remove_logo: false });
                      }
                    }}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
                  />
                </div>
                {formData.logo && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, logo: '', remove_logo: true });
                      setToolImageFile(null);
                    }}
                    className="mt-2 text-sm text-rose-600 hover:underline"
                  >
                    Remove current image
                  </button>
                )}
                <p className="mt-1 text-xs text-slate-500">Recommended ratio: 16:9, max size 10MB.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description Editor</label>
                <div className="hidden mt-2 rounded-2xl border border-slate-200">
                  <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
                    <button type="button" onClick={() => setFormData({ ...formData, description: `${formData.description || ''}\n• ` })} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Bullet</button>
                    <button type="button" onClick={() => insertDescriptionLine('# Heading')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">H1</button>
                    <button type="button" onClick={() => insertDescriptionLine('## Heading')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">H2</button>
                    <button type="button" onClick={() => insertDescriptionLine('### Heading')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">H3</button>
                    <button type="button" onClick={() => insertDescriptionText('**', '**', 'Bold text')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Bold</button>
                    <button type="button" onClick={() => insertDescriptionText('_', '_', 'Italic text')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Italic</button>
                    <button type="button" onClick={() => insertDescriptionText('~~', '~~', 'Strike text')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Strike</button>
                    <button type="button" onClick={() => insertDescriptionText('`', '`', 'inline code')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Code</button>
                    <button type="button" onClick={() => insertDescriptionLine('- List item')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Bullet</button>
                    <button type="button" onClick={() => insertDescriptionLine('1. Numbered item')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Numbered</button>
                    <button type="button" onClick={() => insertDescriptionLine('- [ ] Checklist item')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Checklist</button>
                    <button type="button" onClick={() => insertDescriptionLine('> Quoted text')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Quote</button>
                    <button type="button" onClick={() => insertDescriptionText('[', '](https://)', 'Link text')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Link</button>
                    <button type="button" onClick={() => insertDescriptionLine('---')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Divider</button>
                    <button type="button" onClick={() => insertDescriptionLine('```txt\nYour code block\n```')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Code Block</button>
                  </div>
                  <textarea
                    ref={descriptionEditorRef}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-b-2xl px-3 py-2 focus:outline-none"
                    rows={5}
                    maxLength={TOOL_DESCRIPTION_MAX}
                    required
                  />
                </div>
                <p className="hidden mt-1 text-xs text-slate-500">{(formData.description || '').length}/{TOOL_DESCRIPTION_MAX} characters. Short descriptions show better on tool cards.</p>
                <div className="mt-3">
                  <RichTextEditor
                    value={formData.description || ''}
                    onChange={(nextValue) => setFormData({ ...formData, description: nextValue })}
                    maxLength={TOOL_DESCRIPTION_MAX}
                    minHeightClassName="min-h-[180px]"
                    placeholder="Write a detailed tool description..."
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Use this rich editor. Formatted description will render properly on the website.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} />
                  Featured
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" checked={formData.trending} onChange={(e) => setFormData({ ...formData, trending: e.target.checked })} />
                  Trending
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" checked={formData.just_landed} onChange={(e) => setFormData({ ...formData, just_landed: e.target.checked })} />
                  Just Landed
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" checked={formData.is_top} onChange={(e) => setFormData({ ...formData, is_top: e.target.checked })} />
                  Top AI
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Features (comma separated)</label>
                  <input value={formData.features} onChange={(e) => setFormData({ ...formData, features: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Pros (comma separated)</label>
                  <input value={formData.pros} onChange={(e) => setFormData({ ...formData, pros: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Cons (comma separated)</label>
                  <input value={formData.cons} onChange={(e) => setFormData({ ...formData, cons: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={loading} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {mode === 'create' ? 'Create Tool' : 'Update Tool'}
                </button>
              </div>
            </form>
          )}

          {type === 'category' && (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Slug</label>
                <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Leave empty to auto-generate" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Icon Class</label>
                <input
                  value={formData.icon ?? ''}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                  placeholder="bi bi-robot"
                />
                <p className="mt-1 text-xs text-slate-500">Recommended: Bootstrap Icons class, e.g. `bi bi-mic` or `bi bi-camera-video`.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description Editor</label>
                <div className="hidden mt-2 rounded-2xl border border-slate-200">
                  <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
                    <button type="button" onClick={() => setFormData({ ...formData, description: `${formData.description || ''}\n• ` })} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Bullet</button>
                    <button type="button" onClick={() => insertDescriptionLine('# Heading')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">H1</button>
                    <button type="button" onClick={() => insertDescriptionLine('## Heading')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">H2</button>
                    <button type="button" onClick={() => insertDescriptionLine('### Heading')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">H3</button>
                    <button type="button" onClick={() => insertDescriptionText('**', '**', 'Bold text')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Bold</button>
                    <button type="button" onClick={() => insertDescriptionText('_', '_', 'Italic text')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Italic</button>
                    <button type="button" onClick={() => insertDescriptionText('~~', '~~', 'Strike text')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Strike</button>
                    <button type="button" onClick={() => insertDescriptionText('`', '`', 'inline code')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Code</button>
                    <button type="button" onClick={() => insertDescriptionLine('- List item')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Bullet</button>
                    <button type="button" onClick={() => insertDescriptionLine('1. Numbered item')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Numbered</button>
                    <button type="button" onClick={() => insertDescriptionLine('- [ ] Checklist item')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Checklist</button>
                    <button type="button" onClick={() => insertDescriptionLine('> Quoted text')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Quote</button>
                    <button type="button" onClick={() => insertDescriptionText('[', '](https://)', 'Link text')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Link</button>
                    <button type="button" onClick={() => insertDescriptionLine('---')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Divider</button>
                    <button type="button" onClick={() => insertDescriptionLine('```txt\nYour code block\n```')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">Code Block</button>
                  </div>
                  <textarea
                    ref={descriptionEditorRef}
                    value={formData.description ?? ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-b-2xl px-3 py-2 focus:outline-none"
                    rows={4}
                    maxLength={CATEGORY_DESCRIPTION_MAX}
                  />
                </div>
                <p className="hidden mt-1 text-xs text-slate-500">{(formData.description || '').length}/{CATEGORY_DESCRIPTION_MAX} characters.</p>
                <div className="mt-3">
                  <RichTextEditor
                    value={formData.description || ''}
                    onChange={(nextValue) => setFormData({ ...formData, description: nextValue })}
                    maxLength={CATEGORY_DESCRIPTION_MAX}
                    minHeightClassName="min-h-[140px]"
                    placeholder="Write category description..."
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Use this rich editor for category descriptions.</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={loading} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {mode === 'create' ? 'Create Category' : 'Update Category'}
                </button>
              </div>
            </form>
          )}

          {type === 'user' && (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" required />
              </div>
              {mode === 'create' && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" required />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={loading} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {mode === 'create' ? 'Create User' : 'Update User'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

const handleLogout = () => {
  localStorage.removeItem('toolnavix_token');
  window.location.href = '/login';
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [toolForm, setToolForm] = useState(defaultToolForm);
  const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);
  const [userForm, setUserForm] = useState(defaultUserForm);
  const [postForm, setPostForm] = useState(defaultPostForm);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<Settings>({});
  const [toolImageFile, setToolImageFile] = useState<File | null>(null);
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [isPostCategoryOpen, setIsPostCategoryOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [formModal, setFormModal] = useState<FormModalState>({ isOpen: false, type: null, mode: 'create' });

  const statusText = (tool: Tool) => {
    if (tool.is_top) return 'Top AI';
    if (tool.featured) return 'Featured';
    if (tool.trending) return 'Trending';
    if (tool.just_landed) return 'Just Landed';
    return 'Standard';
  };

  const loadData = async () => {
    setError('');
    setLoading(true);
    try {
      const [statsData, toolsData, categoriesData, postsData, usersData, reviewsData, settingsData] = await Promise.all([
        fetchDashboardStats(),
        fetchTools({ per_page: '50' }),
        fetchCategories(),
        fetchDashboardPosts({ per_page: '50' }),
        fetchDashboardUsers(),
        fetchDashboardReviews(),
        fetchSettings(),
      ]);

      setStats(statsData);
      setTools(toolsData.data ?? []);
      setCategories(categoriesData);
      setPosts((postsData.data ?? []) as Post[]);
      setUsers(usersData.data ?? []);
      setReviews(reviewsData.data ?? []);
      setSettings(settingsData);
    } catch (err) {
      setError('Failed to load dashboard. Please login as admin and refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearToolForm = () => {
    setSelectedTool(null);
    setToolForm(defaultToolForm);
    setToolImageFile(null);
  };

  const clearCategoryForm = () => {
    setSelectedCategory(null);
    setCategoryForm(defaultCategoryForm);
  };

  const clearUserForm = () => {
    setSelectedUser(null);
    setUserForm(defaultUserForm);
  };

  const clearPostForm = () => {
    setSelectedPost(null);
    setPostForm(defaultPostForm);
    setPostImageFile(null);
    setIsPostCategoryOpen(false);
  };

  const parseCsv = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
  const formatPricing = (pricing: string) => (pricing === 'free_trial' ? 'Free trial' : pricing);

  const handleDeleteTool = async (toolId: number) => {
    setModal({
      isOpen: true,
      title: 'Delete Tool',
      message: 'Are you sure you want to delete this tool? This action cannot be undone.',
      onConfirm: async () => {
        setModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setError('');
        setSuccess('');
        setLoading(true);
        try {
          await deleteTool(toolId);
          toast.success('Tool deleted successfully.');
          await loadData();
        } catch (err: any) {
          setError(err.message || 'Unable to delete tool.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleDeleteCategory = async (categoryId: number) => {
    setModal({
      isOpen: true,
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? This action cannot be undone.',
      onConfirm: async () => {
        setModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setError('');
        setSuccess('');
        setLoading(true);
        try {
          await deleteCategory(categoryId);
          toast.success('Category deleted successfully.');
          await loadData();
        } catch (err: any) {
          setError(err.message || 'Unable to delete category.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleBanUser = async (userId: number) => {
    setModal({
      isOpen: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user?',
      onConfirm: async () => {
        setModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setError('');
        setSuccess('');
        setLoading(true);
        try {
          await banUser(userId);
          toast.success('User banned successfully.');
          await loadData();
        } catch (err: any) {
          setError(err.message || 'Unable to delete user.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleApproveReview = async (reviewId: number) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await approveReview(reviewId);
      toast.success('Review approved.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Unable to approve review.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    setModal({
      isOpen: true,
      title: 'Delete Review',
      message: 'Are you sure you want to delete this review? This action cannot be undone.',
      onConfirm: async () => {
        setModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setError('');
        setSuccess('');
        setLoading(true);
        try {
          await deleteReview(reviewId);
          toast.success('Review deleted.');
          await loadData();
        } catch (err: any) {
          setError(err.message || 'Unable to delete review.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleSettingsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      if (logoFile) formData.append('logo', logoFile);
      if (faviconFile) formData.append('favicon', faviconFile);
      formData.append('footer_text', settings.footer_text || '');
      formData.append('hero_badge', settings.hero_badge || '');
      formData.append('hero_title', settings.hero_title || '');
      formData.append('hero_subtitle', settings.hero_subtitle || '');
      formData.append('hero_search_placeholder', settings.hero_search_placeholder || '');
      formData.append('hero_search_button_text', settings.hero_search_button_text || '');
      formData.append('hero_tag_1', settings.hero_tag_1 || '');
      formData.append('hero_tag_2', settings.hero_tag_2 || '');
      formData.append('hero_tag_3', settings.hero_tag_3 || '');

      await updateSettings(formData);
      toast.success('Settings updated successfully.');
      setLogoFile(null);
      setFaviconFile(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Unable to update settings.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = (type: 'tool' | 'category' | 'user') => {
    if (type === 'tool') {
      setToolForm(defaultToolForm);
      setSelectedTool(null);
      setToolImageFile(null);
    } else if (type === 'category') {
      setCategoryForm(defaultCategoryForm);
      setSelectedCategory(null);
    } else if (type === 'user') {
      setUserForm(defaultUserForm);
      setSelectedUser(null);
    }
    setFormModal({ isOpen: true, type, mode: 'create', data: { categories } });
  };

  const openEditModal = (type: 'tool' | 'category' | 'user', item: any) => {
    if (type === 'tool') {
      setSelectedTool(item);
      setToolImageFile(null);
      setToolForm({
        name: item.name,
        slug: item.slug,
        description: item.description,
        category_id: String(item.category?.id ?? ''),
        pricing: item.pricing === 'Free trial' ? 'free_trial' : item.pricing,
        rating: String(item.rating),
        visit_url: item.visit_url,
        featured: item.featured,
        trending: item.trending,
        just_landed: item.just_landed,
        is_top: Boolean(item.is_top),
        logo: item.logo ?? '',
        remove_logo: false,
        features: Array.isArray(item.features) ? item.features.join(', ') : '',
        pros: Array.isArray(item.pros) ? item.pros.join(', ') : '',
        cons: Array.isArray(item.cons) ? item.cons.join(', ') : '',
      });
    } else if (type === 'category') {
      setSelectedCategory(item);
      setCategoryForm({
        name: item.name,
        slug: item.slug,
        description: item.description ?? '',
        icon: item.icon ?? '',
      });
    } else if (type === 'user') {
      setSelectedUser(item);
      setUserForm({
        name: item.name,
        email: item.email,
        password: '',
      });
    }
    setFormModal({ isOpen: true, type, mode: 'edit', data: { categories } });
  };

  const closeFormModal = () => {
    setFormModal({ isOpen: false, type: null, mode: 'create' });
    clearToolForm();
    clearCategoryForm();
    clearUserForm();
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (formModal.type === 'tool') {
        const plainToolDescription = stripHtml(toolForm.description);
        if (!plainToolDescription) {
          setError('Tool description is required.');
          setLoading(false);
          return;
        }
        if (plainToolDescription.length > TOOL_DESCRIPTION_MAX) {
          setError(`Tool description must be ${TOOL_DESCRIPTION_MAX} characters or fewer.`);
          setLoading(false);
          return;
        }

        const payload = new FormData();
        payload.append('name', toolForm.name);
        payload.append('slug', toolForm.slug);
        payload.append('description', toolForm.description);
        payload.append('category_id', String(Number(toolForm.category_id)));
        payload.append('pricing', toolForm.pricing);
        payload.append('rating', String(parseFloat(toolForm.rating) || 0));
        payload.append('visit_url', toolForm.visit_url);
        payload.append('featured', toolForm.featured ? '1' : '0');
        payload.append('trending', toolForm.trending ? '1' : '0');
        payload.append('just_landed', toolForm.just_landed ? '1' : '0');
        payload.append('is_top', toolForm.is_top ? '1' : '0');
        payload.append('features', JSON.stringify(parseCsv(toolForm.features)));
        payload.append('pros', JSON.stringify(parseCsv(toolForm.pros)));
        payload.append('cons', JSON.stringify(parseCsv(toolForm.cons)));

        if (toolImageFile) {
          payload.append('logo', toolImageFile);
        }

        if (toolForm.remove_logo) {
          payload.append('remove_logo', '1');
        }

        if (formModal.mode === 'edit' && selectedTool) {
          await updateTool(selectedTool.id, payload);
          toast.success('Tool updated successfully.');
        } else {
          await createTool(payload);
          toast.success('Tool created successfully.');
        }
      } else if (formModal.type === 'category') {
        const plainCategoryDescription = stripHtml(categoryForm.description);
        if (plainCategoryDescription.length > CATEGORY_DESCRIPTION_MAX) {
          setError(`Category description must be ${CATEGORY_DESCRIPTION_MAX} characters or fewer.`);
          setLoading(false);
          return;
        }

        const payload = {
          name: categoryForm.name,
          slug: categoryForm.slug,
          description: categoryForm.description,
          icon: categoryForm.icon || null,
        };

        if (formModal.mode === 'edit' && selectedCategory) {
          await updateCategory(selectedCategory.id, payload);
          toast.success('Category updated successfully.');
        } else {
          await createCategory(payload);
          toast.success('Category created successfully.');
        }
      } else if (formModal.type === 'user') {
        const payload = {
          name: userForm.name,
          email: userForm.email,
        };

        if (formModal.mode === 'create') {
          await createUser({ ...payload, password: userForm.password });
          toast.success('User created successfully.');
        } else if (formModal.mode === 'edit' && selectedUser) {
          await updateUser(selectedUser.id, payload);
          toast.success('User updated successfully.');
        }
      }

      await loadData();
      closeFormModal();
    } catch (err: any) {
      setError(err.message || 'Unable to save.');
    } finally {
      setLoading(false);
    }
  };

  const openCreatePostForm = () => {
    setSelectedPost(null);
    setPostForm(defaultPostForm);
    setPostImageFile(null);
    setIsPostCategoryOpen(false);
  };

  const openEditPostForm = (post: Post) => {
    setSelectedPost(post);
    setPostForm({
      title: post.title,
      slug: post.slug,
      type: post.type,
      category: post.category || '',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
      excerpt: post.excerpt || '',
      image: post.image || '',
      remove_image: false,
      content: post.content || '',
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      published: Boolean(post.published),
      published_at: post.published_at ? String(post.published_at).slice(0, 16) : '',
    });
    setPostImageFile(null);
    setIsPostCategoryOpen(false);
  };

  const handlePostSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('title', postForm.title);
      payload.append('slug', postForm.slug || '');
      payload.append('type', postForm.type);
      payload.append('category', postForm.category || '');
      payload.append('tags', JSON.stringify(parseCsv(postForm.tags)));
      payload.append('excerpt', postForm.excerpt || '');
      payload.append('content', postForm.content);
      payload.append('meta_title', postForm.meta_title || '');
      payload.append('meta_description', postForm.meta_description || '');
      payload.append('published', postForm.published ? '1' : '0');
      payload.append('published_at', postForm.published_at || '');
      if (postImageFile) {
        payload.append('image', postImageFile);
      }
      if (postForm.remove_image) {
        payload.append('remove_image', '1');
      }

      if (selectedPost) {
        await updatePost(selectedPost.id, payload);
        toast.success('Post updated successfully.');
      } else {
        await createPost(payload);
        toast.success('Post created successfully.');
      }

      await loadData();
      clearPostForm();
    } catch (err: any) {
      setError(err.message || 'Unable to save post.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    setModal({
      isOpen: true,
      title: 'Delete Content',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      onConfirm: async () => {
        setModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setError('');
        setSuccess('');
        setLoading(true);
        try {
          await deletePost(postId);
          toast.success('Post deleted successfully.');
          await loadData();
          if (selectedPost?.id === postId) {
            clearPostForm();
          }
        } catch (err: any) {
          setError(err.message || 'Unable to delete post.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const toolsByStatus = useMemo(() => ({
    top: tools.filter((tool) => tool.is_top),
    trending: tools.filter((tool) => tool.trending),
    featured: tools.filter((tool) => tool.featured),
    just_landed: tools.filter((tool) => tool.just_landed),
  }), [tools]);

  const filteredPostCategories = useMemo(() => {
    const query = (postForm.category || '').trim().toLowerCase();
    if (!query) return categories;

    return categories.filter((category) => category.name.toLowerCase().includes(query));
  }, [categories, postForm.category]);

  if (error && !stats) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="card max-w-lg text-center text-slate-700">
          <p>{error}</p>
          <a href="/login" className="mt-3 inline-block text-indigo-600 hover:underline">Login</a>
        </div>
      </main>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
      <div className="flex min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white">
        {/* Sidebar */}
        <aside className="sticky top-0 h-screen w-64 border-r border-slate-200 bg-white/95 p-6 backdrop-blur">
          <div className="flex items-center gap-3 mb-8">
            {settings.logo_url ? (
              <div className="h-12 w-100 overflow-hidden rounded-lg bg-white flex items-center justify-center">
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
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
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

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {(error || success) && (
              <div className="space-y-2">
                {error && <div className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>}
                {success && <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-700">{success}</div>}
              </div>
            )}

            {activeTab === 'Overview' && (
              <>
                <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-600 to-indigo-500 p-6 text-white shadow-lg">
                  <p className="text-sm uppercase tracking-[0.18em] text-indigo-100">Dashboard Overview</p>
                  <h1 className="mt-2 text-3xl font-bold">Analytics Snapshot</h1>
                  <p className="mt-2 text-sm text-indigo-100">Monitor platform growth, content quality, and catalog health in one place.</p>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total Tools</p>
                      <span className="rounded-xl bg-indigo-100 p-2 text-indigo-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3a.75.75 0 00-.75.75v16.5a.75.75 0 001.28.53l4.72-4.72h5.25a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-10.5z" />
                        </svg>
                      </span>
                    </div>
                    <p className="mt-3 text-4xl font-bold text-slate-900">{stats.total_tools}</p>
                    <p className="mt-1 text-xs text-slate-500">{toolsByStatus.featured.length} featured, {toolsByStatus.top.length} top</p>
                    <button onClick={() => setActiveTab('Tools')} className="mt-4 text-sm font-semibold text-indigo-600 hover:underline">
                      View
                    </button>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total Users</p>
                      <span className="rounded-xl bg-emerald-100 p-2 text-emerald-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-2a4 4 0 00-4-4H11a4 4 0 00-4 4v2m10 0H7m10-9a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                    </div>
                    <p className="mt-3 text-4xl font-bold text-slate-900">{stats.total_users}</p>
                    <p className="mt-1 text-xs text-slate-500">{users.filter((user) => !user.banned).length} active</p>
                    <button onClick={() => setActiveTab('Users')} className="mt-4 text-sm font-semibold text-indigo-600 hover:underline">
                      View
                    </button>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total Views</p>
                      <span className="rounded-xl bg-cyan-100 p-2 text-cyan-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
                          <circle cx="12" cy="12" r="3" strokeWidth="2" />
                        </svg>
                      </span>
                    </div>
                    <p className="mt-3 text-4xl font-bold text-slate-900">{stats.total_views}</p>
                    <p className="mt-1 text-xs text-slate-500">Total tool detail visits</p>
                    <button onClick={() => setActiveTab('Tools')} className="mt-4 text-sm font-semibold text-indigo-600 hover:underline">
                      View
                    </button>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total Categories</p>
                      <span className="rounded-xl bg-amber-100 p-2 text-amber-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h7l2 2h7v10a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                        </svg>
                      </span>
                    </div>
                    <p className="mt-3 text-4xl font-bold text-slate-900">{categories.length}</p>
                    <p className="mt-1 text-xs text-slate-500">Taxonomy groups</p>
                    <button onClick={() => setActiveTab('Categories')} className="mt-4 text-sm font-semibold text-indigo-600 hover:underline">
                      View
                    </button>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pending Reviews</p>
                      <span className="rounded-xl bg-rose-100 p-2 text-rose-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H8l-4 4v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                    </div>
                    <p className="mt-3 text-4xl font-bold text-slate-900">{reviews.filter((review) => !review.approved).length}</p>
                    <p className="mt-1 text-xs text-slate-500">{reviews.length} total reviews</p>
                    <button onClick={() => setActiveTab('Reviews')} className="mt-4 text-sm font-semibold text-indigo-600 hover:underline">
                      View
                    </button>
                  </article>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900">Content Mix</h2>
                      <span className="text-xs text-slate-500">Live</span>
                    </div>
                    <div className="mt-5 space-y-4">
                      {[
                        { label: 'Top AI', value: toolsByStatus.top.length, color: 'bg-fuchsia-500' },
                        { label: 'Featured', value: toolsByStatus.featured.length, color: 'bg-indigo-500' },
                        { label: 'Trending', value: toolsByStatus.trending.length, color: 'bg-emerald-500' },
                        { label: 'Just Landed', value: toolsByStatus.just_landed.length, color: 'bg-amber-500' },
                      ].map((item) => {
                        const max = Math.max(1, stats.total_tools);
                        const width = Math.max(6, Math.round((item.value / max) * 100));
                        return (
                          <div key={item.label}>
                            <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                              <span>{item.label}</span>
                              <span className="font-semibold text-slate-900">{item.value}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-slate-100">
                              <div className={`h-2.5 rounded-full ${item.color}`} style={{ width: `${width}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Top Lists</h2>
                    <div className="mt-4 space-y-4">
                      <div>
                        <h3 className="text-xs uppercase tracking-[0.16em] text-slate-500">Trending Tools</h3>
                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {stats.trending_tools.slice(0, 4).map((tool) => <li key={tool.id}>{tool.name}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-xs uppercase tracking-[0.16em] text-slate-500">New Tools</h3>
                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {stats.new_tools.slice(0, 4).map((tool) => <li key={tool.id}>{tool.name}</li>)}
                        </ul>
                      </div>
                    </div>
                  </article>
                </section>
              </>
            )}

            {activeTab === 'Tools' && (
              <section className="space-y-4">
                <div className="card">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Tools</h2>
                    <button
                      onClick={() => openCreateModal('tool')}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Tool
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{tools.length} records</p>
                </div>
                {formModal.isOpen && formModal.type === 'tool' && (
                  <FormModal
                    isOpen={true}
                    type="tool"
                    mode={formModal.mode}
                    data={formModal.data}
                    onClose={closeFormModal}
                    onSubmit={handleFormSubmit}
                    formData={toolForm}
                    setFormData={setToolForm}
                    loading={loading}
                    toolImageFile={toolImageFile}
                    setToolImageFile={setToolImageFile}
                  />
                )}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Pricing</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tools.map((tool) => (
                        <tr key={tool.id} className="border-t border-slate-200">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                {tool.logo ? (
                                  <img src={tool.logo} alt={tool.name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-500">
                                    No image
                                  </div>
                                )}
                              </div>
                              <span>{tool.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{tool.category?.name}</td>
                          <td className="px-4 py-3">{formatPricing(tool.pricing)}</td>
                          <td className="px-4 py-3">{statusText(tool)}</td>
                          <td className="px-4 py-3 space-x-2">
                            <button onClick={() => openEditModal('tool', tool)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200">Edit</button>
                            <button onClick={() => handleDeleteTool(tool.id)} className="rounded-lg bg-rose-100 px-3 py-1 text-sm text-rose-700 hover:bg-rose-200">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'Categories' && (
              <section className="space-y-4">
                <div className="card">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
                    <button
                      onClick={() => openCreateModal('category')}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Category
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{categories.length} categories</p>
                </div>
                {formModal.isOpen && formModal.type === 'category' && (
                  <FormModal
                    isOpen={true}
                    type="category"
                    mode={formModal.mode}
                    data={formModal.data}
                    onClose={closeFormModal}
                    onSubmit={handleFormSubmit}
                    formData={categoryForm}
                    setFormData={setCategoryForm}
                    loading={loading}
                    toolImageFile={toolImageFile}
                    setToolImageFile={setToolImageFile}
                  />
                )}
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div key={category.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <i className={category.icon || 'bi bi-grid'} aria-hidden="true" />
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">{category.name}</p>
                            <p className="text-sm text-slate-500">{category.slug}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openEditModal('category', category)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200">Edit</button>
                          <button onClick={() => handleDeleteCategory(category.id)} className="rounded-lg bg-rose-100 px-3 py-1 text-sm text-rose-700 hover:bg-rose-200">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'Content' && (
              <section className="space-y-5">
                <div className="card">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Content Management</h2>
                    <button
                      onClick={openCreatePostForm}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Post
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage Blog, AI News, and Guides from one place.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Blog</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{posts.filter((post) => post.type === 'blog').length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">AI News</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{posts.filter((post) => post.type === 'news').length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Guides</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{posts.filter((post) => post.type === 'guide').length}</p>
                    </div>
                  </div>
                </div>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">{selectedPost ? 'Edit Content' : 'Create Content'}</h3>
                  <form onSubmit={handlePostSubmit} className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Title</label>
                        <input
                          value={postForm.title}
                          onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Slug</label>
                        <input
                          value={postForm.slug}
                          onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                          placeholder="Leave empty to auto-generate"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Type</label>
                        <select
                          value={postForm.type}
                          onChange={(e) => setPostForm({ ...postForm, type: e.target.value as 'blog' | 'news' | 'guide' })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                        >
                          <option value="blog">Blog</option>
                          <option value="news">AI News</option>
                          <option value="guide">Guide</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Category</label>
                        <div className="relative mt-2">
                          <input
                            value={postForm.category}
                            onChange={(e) => {
                              setPostForm({ ...postForm, category: e.target.value });
                              setIsPostCategoryOpen(true);
                            }}
                            onFocus={() => setIsPostCategoryOpen(true)}
                            onBlur={() => setTimeout(() => setIsPostCategoryOpen(false), 120)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2"
                            placeholder="Search or type category"
                          />
                          {isPostCategoryOpen && (
                            <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                              {filteredPostCategories.slice(0, 12).map((category) => (
                                <button
                                  key={category.id}
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    setPostForm({ ...postForm, category: category.name });
                                    setIsPostCategoryOpen(false);
                                  }}
                                  className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  {category.name}
                                </button>
                              ))}
                              {filteredPostCategories.length === 0 && (
                                <p className="px-3 py-2 text-xs text-slate-500">No matching categories</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Publish Date</label>
                        <input
                          type="datetime-local"
                          value={postForm.published_at}
                          onChange={(e) => setPostForm({ ...postForm, published_at: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">Tags (comma separated)</label>
                      <input
                        value={postForm.tags}
                        onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                        placeholder="ai, productivity, writing"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">Excerpt</label>
                      <textarea
                        value={postForm.excerpt}
                        onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">Post Image</label>
                      <div className="mt-2 flex items-center gap-4">
                        {postForm.image && !postImageFile && (
                          <div className="h-16 w-28 overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <img src={postForm.image} alt="Post preview" className="h-full w-full object-cover" />
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
                            if (file) {
                              setPostForm({ ...postForm, remove_image: false });
                            }
                          }}
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
                        />
                      </div>
                      {postForm.image && (
                        <button
                          type="button"
                          onClick={() => {
                            setPostForm({ ...postForm, image: '', remove_image: true });
                            setPostImageFile(null);
                          }}
                          className="mt-2 text-sm text-rose-600 hover:underline"
                        >
                          Remove current image
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">Content</label>
                      <div className="mt-2">
                        <RichTextEditor
                          value={postForm.content}
                          onChange={(nextValue) => setPostForm({ ...postForm, content: nextValue })}
                          minHeightClassName="min-h-[220px]"
                          placeholder="Write post content..."
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Meta Title</label>
                        <input
                          value={postForm.meta_title}
                          onChange={(e) => setPostForm({ ...postForm, meta_title: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Meta Description</label>
                        <input
                          value={postForm.meta_description}
                          onChange={(e) => setPostForm({ ...postForm, meta_description: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                        />
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={postForm.published}
                        onChange={(e) => setPostForm({ ...postForm, published: e.target.checked })}
                      />
                      Published
                    </label>

                    <div className="flex flex-wrap justify-end gap-3">
                      {selectedPost && (
                        <button
                          type="button"
                          onClick={clearPostForm}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {selectedPost ? 'Update Post' : 'Create Post'}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Post</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Published</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((post) => (
                        <tr key={post.id} className="border-t border-slate-200">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                {post.image ? (
                                  <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-500">
                                    No image
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{post.title}</p>
                                <p className="text-xs text-slate-500">/{post.type === 'news' ? 'ai-news' : post.type === 'guide' ? 'guides' : 'blog'}/{post.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 uppercase">{post.type}</td>
                          <td className="px-4 py-3">{post.category || 'General'}</td>
                          <td className="px-4 py-3">{post.published ? 'Published' : 'Draft'}</td>
                          <td className="px-4 py-3 space-x-2">
                            <button onClick={() => openEditPostForm(post)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200">Edit</button>
                            <button onClick={() => handleDeletePost(post.id)} className="rounded-lg bg-rose-100 px-3 py-1 text-sm text-rose-700 hover:bg-rose-200">Delete</button>
                          </td>
                        </tr>
                      ))}
                      {posts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No content found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </section>
              </section>
            )}

            {activeTab === 'Users' && (
              <section className="card">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Users</h2>
                  <button
                    onClick={() => openCreateModal('user')}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create User
                  </button>
                </div>
                {formModal.isOpen && formModal.type === 'user' && (
                  <div className="mt-4">
                    <FormModal
                      isOpen={true}
                      type="user"
                      mode={formModal.mode}
                      data={formModal.data}
                      onClose={closeFormModal}
                      onSubmit={handleFormSubmit}
                      formData={userForm}
                      setFormData={setUserForm}
                      loading={loading}
                      toolImageFile={toolImageFile}
                      setToolImageFile={setToolImageFile}
                    />
                  </div>
                )}
                <span className="text-sm text-slate-500 mt-1">{users.length} users</span>
                <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-t border-slate-200">
                          <td className="px-4 py-3">{user.name}</td>
                          <td className="px-4 py-3">{user.email}</td>
                          <td className="px-4 py-3">{user.is_admin ? 'Admin' : 'Member'}</td>
                          <td className="px-4 py-3">{user.banned ? 'Banned' : 'Active'}</td>
                          <td className="px-4 py-3 space-x-2">
                            <button onClick={() => openEditModal('user', user)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200">Edit</button>
                            {!user.is_admin && (
                              <button disabled={user.banned} onClick={() => handleBanUser(user.id)} className="rounded-lg bg-rose-100 px-3 py-1 text-sm text-rose-700 hover:bg-rose-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'Reviews' && (
              <section className="card">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
                  <span className="text-sm text-slate-500">{reviews.length} reviews</span>
                </div>
                <div className="mt-4 space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{review.user.name} — {review.tool.name}</p>
                          <p className="text-sm text-slate-500">{new Date(review.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${review.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {review.approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-700">{review.comment}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {!review.approved && (
                          <button onClick={() => handleApproveReview(review.id)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Approve</button>
                        )}
                        <button onClick={() => handleDeleteReview(review.id)} className="rounded-lg bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'Settings' && (
              <section className="card">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Settings</h2>
                <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-700 mb-4">Current dashboard branding</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center">
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Current logo</span>
                      {settings.logo_url ? (
                        <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-white flex items-center justify-center">
                          <img src={settings.logo_url} alt="Current logo" className="max-h-full max-w-full object-contain" />
                        </div>
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100 text-xs text-slate-500">
                          No logo set
                        </div>
                      )}
                      <span className="text-xs text-slate-500 break-all">{settings.logo_url || 'Logo URL not available'}</span>
                    </div>
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center">
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Current favicon</span>
                      {settings.favicon_url ? (
                        <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-white flex items-center justify-center">
                          <img src={settings.favicon_url} alt="Current favicon" className="max-h-full max-w-full object-contain" />
                        </div>
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100 text-xs text-slate-500">
                          No favicon set
                        </div>
                      )}
                      <span className="text-xs text-slate-500 break-all">{settings.favicon_url || 'Favicon URL not available'}</span>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleSettingsSubmit} className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Logo</label>
                      <div className="mt-2 flex items-center gap-4">
                        {settings.logo_url && (
                          <div className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-white flex items-center justify-center">
                            <img src={settings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Recommended: 512x512px</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Favicon</label>
                      <div className="mt-2 flex items-center gap-4">
                        {settings.favicon_url && (
                          <div className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-white flex items-center justify-center">
                            <img src={settings.favicon_url} alt="Favicon" className="max-h-full max-w-full object-contain" />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                          className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Recommended: 256x256px or 64x64px</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Footer Text</label>
                    <textarea
                      value={settings.footer_text || ''}
                      onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2"
                      rows={2}
                      placeholder="© 2026 ToolNavix. All rights reserved."
                    />
                    <p className="mt-1 text-xs text-slate-500">This text appears in the website footer.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-800">Homepage Hero Content</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Hero Badge</label>
                        <input
                          value={settings.hero_badge || ''}
                          onChange={(e) => setSettings({ ...settings, hero_badge: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                          placeholder="AI tools marketplace"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Search Button Text</label>
                        <input
                          value={settings.hero_search_button_text || ''}
                          onChange={(e) => setSettings({ ...settings, hero_search_button_text: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                          placeholder="AI Search"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-medium text-slate-700">Hero Title</label>
                      <textarea
                        value={settings.hero_title || ''}
                        onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2"
                        rows={2}
                        placeholder="Find the exact AI tool you need, instantly"
                      />
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-medium text-slate-700">Hero Subtitle</label>
                      <textarea
                        value={settings.hero_subtitle || ''}
                        onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2"
                        rows={3}
                        placeholder="Search, compare and bookmark AI tools..."
                      />
                    </div>
                    <div className="mt-4">
                      <label className="text-sm font-medium text-slate-700">Search Placeholder</label>
                      <input
                        value={settings.hero_search_placeholder || ''}
                        onChange={(e) => setSettings({ ...settings, hero_search_placeholder: e.target.value })}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                        placeholder="Search AI tools by use case..."
                      />
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Tag 1</label>
                        <input
                          value={settings.hero_tag_1 || ''}
                          onChange={(e) => setSettings({ ...settings, hero_tag_1: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                          placeholder="YouTube tools"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Tag 2</label>
                        <input
                          value={settings.hero_tag_2 || ''}
                          onChange={(e) => setSettings({ ...settings, hero_tag_2: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                          placeholder="AI editors"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Tag 3</label>
                        <input
                          value={settings.hero_tag_3 || ''}
                          onChange={(e) => setSettings({ ...settings, hero_tag_3: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                          placeholder="Script generators"
                        />
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Leave any field empty to use default homepage text.</p>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Save Settings
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
