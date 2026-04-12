'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';
import FilterBar from '../components/FilterBar';
import { ConfirmModal } from '../components/ConfirmModal';
import RichTextEditor from '../components/RichTextEditor';
import { stripHtml } from '../lib/richText';
import {
  createCategory,
  createTool,
  createUser,
  deleteCategory,
  deleteReview,
  deleteTool,
  deleteUser,
  bulkDeleteCategories,
  bulkDeletePosts,
  bulkDeleteTools,
  bulkDeleteUsers,
  bulkDeleteReviews,
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
import { handleAdminAccessError } from '../lib/adminAccess';

const tabs = ['Overview', 'Tools', 'Categories', 'Content', 'Users', 'Settings'] as const;
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
  logo_alt?: string | null;
  logo_title?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
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
  image_alt?: string | null;
  image_title?: string | null;
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
  logo_alt: '',
  logo_title: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
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
  image_alt: '',
  image_title: '',
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
  type: 'tool' | 'category' | 'user' | 'post' | null;
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

const FormModal = ({ isOpen, type, mode, data, onClose, onSubmit, formData, setFormData, submitting, imageFile, setImageFile }: {
  isOpen: boolean;
  type: 'tool' | 'category' | 'user' | 'post' | null;
  mode: 'create' | 'edit';
  data?: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  submitting: boolean;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
}) => {
  if (!isOpen || !type) return null;

  const title = mode === 'create' ? `Create ${type === 'tool' ? 'Tool' : type === 'category' ? 'Category' : type === 'user' ? 'User' : 'Post'}` : `Edit ${type === 'tool' ? 'Tool' : type === 'category' ? 'Category' : type === 'user' ? 'User' : 'Post'}`;
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
                <div className="mt-2">
                  <ImageUpload
                    currentImage={formData.logo}
                    onImageSelect={(file) => {
                      setImageFile(file);
                      setFormData({ ...formData, remove_logo: false });
                    }}
                    onImageRemove={() => {
                      setFormData({ ...formData, logo: '', remove_logo: true });
                      setImageFile(null);
                    }}
                  />
                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, logo: '', remove_logo: true });
                        setImageFile(null);
                      }}
                      className="mt-2 text-sm text-rose-600 hover:underline"
                    >
                      Remove current image
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">Recommended ratio: 16:9, max size 10MB.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">SEO Settings</label>
                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Logo Alt Text</label>
                    <input
                      value={formData.logo_alt || ''}
                      onChange={(e) => setFormData({ ...formData, logo_alt: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                      placeholder="Descriptive alt text for logo"
                    />
                    <p className="mt-1 text-xs text-slate-500">Alt text for screen readers and SEO</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Logo Title</label>
                    <input
                      value={formData.logo_title || ''}
                      onChange={(e) => setFormData({ ...formData, logo_title: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                      placeholder="Tooltip text for logo"
                    />
                    <p className="mt-1 text-xs text-slate-500">Title attribute for hover tooltip</p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium text-slate-700">Meta Title</label>
                  <input
                    value={formData.meta_title || ''}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                    placeholder="Custom page title for SEO"
                    maxLength={60}
                  />
                  <p className="mt-1 text-xs text-slate-500">{(formData.meta_title || '').length}/60 characters. Leave empty to use default.</p>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium text-slate-700">Meta Description</label>
                  <textarea
                    value={formData.meta_description || ''}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                    rows={2}
                    placeholder="Brief description for search results"
                    maxLength={160}
                  />
                  <p className="mt-1 text-xs text-slate-500">{(formData.meta_description || '').length}/160 characters. Leave empty to use default.</p>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium text-slate-700">Meta Keywords</label>
                  <input
                    value={formData.meta_keywords || ''}
                    onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <p className="mt-1 text-xs text-slate-500">Comma-separated keywords for SEO</p>
                </div>
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
                <button type="submit" disabled={submitting} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
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
                <button type="submit" disabled={submitting} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
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
                <button type="submit" disabled={submitting} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {mode === 'create' ? 'Create User' : 'Update User'}
                </button>
              </div>
            </form>
          )}

          {type === 'post' && (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Title</label>
                  <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Slug</label>
                  <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Leave empty to auto-generate" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2">
                    <option value="blog">Blog</option>
                    <option value="news">News</option>
                    <option value="guide">Guide</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Optional category" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Tags (comma separated)</label>
                <input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Excerpt</label>
                <textarea value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" rows={3} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Featured Image</label>
                <div className="mt-2">
                  <ImageUpload
                    currentImage={formData.image}
                    onImageSelect={(file) => {
                      setImageFile(file);
                      setFormData({ ...formData, remove_image: false });
                    }}
                    onImageRemove={() => {
                      setFormData({ ...formData, image: '', remove_image: true });
                      setImageFile(null);
                    }}
                  />
                  {formData.image && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, image: '', remove_image: true });
                        setImageFile(null);
                      }}
                      className="mt-2 text-sm text-rose-600 hover:underline"
                    >
                      Remove current image
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">Recommended ratio: 16:9, max size 10MB.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Image SEO</label>
                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Image Alt Text</label>
                    <input
                      value={formData.image_alt || ''}
                      onChange={(e) => setFormData({ ...formData, image_alt: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                      placeholder="Descriptive alt text for image"
                    />
                    <p className="mt-1 text-xs text-slate-500">Alt text for screen readers and SEO</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Image Title</label>
                    <input
                      value={formData.image_title || ''}
                      onChange={(e) => setFormData({ ...formData, image_title: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                      placeholder="Tooltip text for image"
                    />
                    <p className="mt-1 text-xs text-slate-500">Title attribute for hover tooltip</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Content</label>
                <RichTextEditor
                  value={formData.content || ''}
                  onChange={(nextValue) => setFormData({ ...formData, content: nextValue })}
                  minHeightClassName="min-h-[200px]"
                  placeholder="Write your content here..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Meta Title</label>
                  <input value={formData.meta_title} onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Meta Description</label>
                  <input value={formData.meta_description} onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" checked={formData.published} onChange={(e) => setFormData({ ...formData, published: e.target.checked })} />
                  Published
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {mode === 'create' ? 'Create Post' : 'Update Post'}
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
  return (
    <Suspense fallback={<div className="min-h-screen">Loading...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [stats, setStats] = useState<Stats>({
    total_tools: 0,
    total_users: 0,
    total_views: 0,
    trending_tools: [],
    featured_tools: [],
    new_tools: [],
  });

  // Read tab from URL query params
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam && tabs.includes(tabParam as Tab)) {
      setActiveTab(tabParam as Tab);
    }
  }, [searchParams]);

  // Clear selections when tab changes
  useEffect(() => {
    setSelectedTools(new Set());
    setSelectedCategories(new Set());
    setSelectedPosts(new Set());
    setSelectedUsers(new Set());
  }, [activeTab]);

  // Initialize state with cached data
  const initializeFromCache = () => {
    if (typeof window === 'undefined') return {};
    try {
      const cached = sessionStorage.getItem('dashboardCache');
      if (cached) {
        const data = JSON.parse(cached);
        // Sort all data by created_at descending before returning
        if (data.tools) {
          data.tools.sort((a: any, b: any) => {
            const aDate = new Date(a.created_at || 0).getTime();
            const bDate = new Date(b.created_at || 0).getTime();
            return bDate - aDate;
          });
        }
        if (data.categories) {
          data.categories.sort((a: any, b: any) => {
            const aDate = new Date(a.created_at || 0).getTime();
            const bDate = new Date(b.created_at || 0).getTime();
            return bDate - aDate;
          });
        }
        if (data.posts) {
          data.posts.sort((a: any, b: any) => {
            const aDate = new Date(a.published_at || a.created_at || 0).getTime();
            const bDate = new Date(b.published_at || b.created_at || 0).getTime();
            return bDate - aDate;
          });
        }
        if (data.users) {
          data.users.sort((a: any, b: any) => {
            const aDate = new Date(a.created_at).getTime();
            const bDate = new Date(b.created_at).getTime();
            return bDate - aDate;
          });
        }
        if (data.reviews) {
          data.reviews.sort((a: any, b: any) => {
            const aDate = new Date(a.created_at).getTime();
            const bDate = new Date(b.created_at).getTime();
            return bDate - aDate;
          });
        }
        return data;
      }
    } catch (err) {
      // Silently ignore cache errors
    }
    return {};
  };

  const cachedData = initializeFromCache();
  const [hydrated, setHydrated] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [toolFilters, setToolFilters] = useState({ search: '', pricing: '', featured: false, trending: false, just_landed: false });
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [categoryFilters, setCategoryFilters] = useState({ search: '' });
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userFilters, setUserFilters] = useState({ search: '', admin: '' });
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [postFilters, setPostFilters] = useState({ search: '', type: '', published: '' });
  const [reviews, setReviews] = useState<any[]>([]);
  const [toolForm, setToolForm] = useState(defaultToolForm);
  const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);
  const [userForm, setUserForm] = useState(defaultUserForm);
  const [postForm, setPostForm] = useState(defaultPostForm);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<Settings>({});
  const [toolImageFile, setToolImageFile] = useState<File | null>(null);
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [isPostCategoryOpen, setIsPostCategoryOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeFavicon, setRemoveFavicon] = useState(false);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [formModal, setFormModal] = useState<FormModalState>({ isOpen: false, type: null, mode: 'create' });
  const [formData, setFormData] = useState<any>({});
  const [authChecked, setAuthChecked] = useState(false);

  // Bulk delete state
  const [selectedTools, setSelectedTools] = useState<Set<number>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());

  // Initialize with cache only after hydration
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = window.localStorage.getItem('toolnavix_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    if (typeof window === 'undefined') return;

    setHydrated(true);
    
    // Check for refresh item from form submission first
    const checkRefreshItem = () => {
      if (typeof window === 'undefined') return false;
      
      try {
        const stored = sessionStorage.getItem('dashboardRefreshItem');
        if (stored) {
          const { type, data, timestamp } = JSON.parse(stored);
          
          // Only use if less than 30 seconds old
          if (Date.now() - timestamp < 30000) {
            // Add/update the item in local state immediately without showing loading
            if (type === 'tool' && data) {
              setTools(prevTools => {
                const filtered = prevTools.filter(t => t.id !== data.id);
                return [data, ...filtered];
              });
            } else if (type === 'category' && data) {
              setCategories(prevCats => {
                const filtered = prevCats.filter(c => c.id !== data.id);
                return [data, ...filtered];
              });
            } else if (type === 'post' && data) {
              setPosts(prevPosts => {
                const filtered = prevPosts.filter(p => p.id !== data.id);
                return [data, ...filtered];
              });
            } else if (type === 'user' && data) {
              setUsers(prevUsers => {
                const filtered = prevUsers.filter(u => u.id !== data.id);
                return [data, ...filtered];
              });
            }
          }
          
          // Clear the stored item
          sessionStorage.removeItem('dashboardRefreshItem');
          
          // Refresh data in background WITHOUT showing loading spinner
          loadData({ showLoading: false }).catch(() => {});
          
          return true;
        }
      } catch (err) {
        // Silently ignore JSON parse errors
      }
      return false;
    };

    // Load cached data first
    if (cachedData.tools) setTools(cachedData.tools);
    if (cachedData.categories) setCategories(cachedData.categories);
    if (cachedData.posts) setPosts(cachedData.posts);
    if (cachedData.users) setUsers(cachedData.users);
    if (cachedData.reviews) setReviews(cachedData.reviews);
    if (cachedData.settings) setSettings(cachedData.settings);

    // If we have cached data, set loading to false initially
    if (cachedData.tools) {
      setLoading(false);
    }

    // If we have cached data and there's a refresh item, use the refresh logic
    if (checkRefreshItem()) {
      return;
    }

    // Otherwise, load data normally (with loading spinner only if no cache)
    loadData({ showLoading: !cachedData.tools });
  }, [authChecked]);

  const statusText = (tool: Tool) => {
    if (tool.is_top) return 'Top AI';
    if (tool.featured) return 'Featured';
    if (tool.trending) return 'Trending';
    if (tool.just_landed) return 'Just Landed';
    return 'Standard';
  };

  const loadData = async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setError('');
      setLoading(true);
    }

    try {
      // Load critical data first (tools, categories, posts)
      const [statsData, toolsData, categoriesData, postsData, settingsData] = await Promise.all([
        fetchDashboardStats(),
        fetchTools({ per_page: '50' }),
        fetchCategories(),
        fetchDashboardPosts({ per_page: '50' }),
        fetchSettings(),
      ]);

      const newTools = toolsData.data ?? [];
      const newCategories = categoriesData;
      const newPosts = (postsData.data ?? []) as Post[];
      const newSettings = settingsData;

      setStats(statsData);
      setTools(newTools);
      setCategories(newCategories);
      setPosts(newPosts);
      setSettings(newSettings);

      if (showLoading) {
        setLoading(false);
      }

      // Cache the data for instant display on return
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dashboardCache', JSON.stringify({
          tools: newTools,
          categories: newCategories,
          posts: newPosts,
          settings: newSettings,
          users: tools, // Use current state to avoid losing user data
          reviews: reviews,
        }));
      }

      // Load secondary data in background (users, reviews) without blocking UI
      try {
        const [usersData, reviewsData] = await Promise.all([
          fetchDashboardUsers(),
          fetchDashboardReviews(),
        ]);
        const newUsers = usersData.data ?? [];
        const newReviews = (reviewsData.data ?? []).sort((a, b) => {
          const aDate = new Date(a.created_at).getTime();
          const bDate = new Date(b.created_at).getTime();
          return bDate - aDate;
        });
        setUsers(newUsers);
        setReviews(newReviews);
        
        // Update cache with users and reviews
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('dashboardCache', JSON.stringify({
            tools: newTools,
            categories: newCategories,
            posts: newPosts,
            settings: newSettings,
            users: newUsers,
            reviews: newReviews,
          }));
        }
      } catch (err) {
        // Silently fail for secondary data
      }
    } catch (err) {
      if (handleAdminAccessError(router, err)) {
        setLoading(false);
        return;
      }
      if (showLoading) {
        setError('Failed to load dashboard. Please login as admin and refresh.');
        setLoading(false);
      }
    }
  };

  // Filter effects
  useEffect(() => {
    const filtered = tools.filter((tool) => {
      if (toolFilters.search && !tool.name.toLowerCase().includes(toolFilters.search.toLowerCase())) return false;
      if (toolFilters.pricing && tool.pricing !== toolFilters.pricing) return false;
      if (toolFilters.featured && !tool.featured) return false;
      if (toolFilters.trending && !tool.trending) return false;
      if (toolFilters.just_landed && !tool.just_landed) return false;
      return true;
    });
    // Sort by created_at descending (newest first)
    filtered.sort((a, b) => {
      const aDate = new Date((a as any).created_at || 0).getTime();
      const bDate = new Date((b as any).created_at || 0).getTime();
      return bDate - aDate;
    });
    setFilteredTools(filtered);
  }, [tools, toolFilters]);

  useEffect(() => {
    const filtered = categories.filter((cat) => {
      if (categoryFilters.search && !cat.name.toLowerCase().includes(categoryFilters.search.toLowerCase())) return false;
      return true;
    });
    // Sort by created_at descending (newest first)
    filtered.sort((a, b) => {
      const aDate = new Date((a as any).created_at || 0).getTime();
      const bDate = new Date((b as any).created_at || 0).getTime();
      return bDate - aDate;
    });
    setFilteredCategories(filtered);
  }, [categories, categoryFilters]);

  useEffect(() => {
    const filtered = users.filter((user) => {
      if (userFilters.search && !user.name.toLowerCase().includes(userFilters.search.toLowerCase()) && !user.email.toLowerCase().includes(userFilters.search.toLowerCase())) return false;
      if (userFilters.admin === 'true' && !user.is_admin) return false;
      if (userFilters.admin === 'false' && user.is_admin) return false;
      return true;
    });
    // Sort by created_at descending (newest first)
    filtered.sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return bDate - aDate;
    });
    setFilteredUsers(filtered);
  }, [users, userFilters]);

  useEffect(() => {
    const filtered = posts.filter((post) => {
      if (postFilters.search && !post.title.toLowerCase().includes(postFilters.search.toLowerCase())) return false;
      if (postFilters.type && post.type !== postFilters.type) return false;
      if (postFilters.published === 'true' && !post.published) return false;
      if (postFilters.published === 'false' && post.published) return false;
      return true;
    });
    // Sort by published_at or created_at descending (newest first)
    filtered.sort((a, b) => {
      const aDate = new Date((a as any).published_at || (a as any).created_at || 0).getTime();
      const bDate = new Date((b as any).published_at || (b as any).created_at || 0).getTime();
      return bDate - aDate;
    });
    setFilteredPosts(filtered);
  }, [posts, postFilters]);

  // Filter handlers
  const handleToolFiltersChange = (filters: Record<string, string | boolean>) => {
    setToolFilters(filters as typeof toolFilters);
  };

  const handleCategoryFiltersChange = (filters: Record<string, string | boolean>) => {
    setCategoryFilters(filters as typeof categoryFilters);
  };

  const handleUserFiltersChange = (filters: Record<string, string | boolean>) => {
    setUserFilters(filters as typeof userFilters);
  };

  const handlePostFiltersChange = (filters: Record<string, string | boolean>) => {
    setPostFilters(filters as typeof postFilters);
  };

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
      title: 'Ban User',
      message: 'Are you sure you want to ban this user? They will not be able to access their account.',
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
          setError(err.message || 'Unable to ban user.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleDeleteUser = async (userId: number) => {
    setModal({
      isOpen: true,
      title: 'Delete User',
      message: 'Are you sure you want to permanently delete this user? This action cannot be undone.',
      onConfirm: async () => {
        setModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setError('');
        setSuccess('');
        setLoading(true);
        try {
          await deleteUser(userId);
          toast.success('User deleted successfully.');
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
    setSubmitting(true);

    try {
      const formData = new FormData();
      if (logoFile) formData.append('logo', logoFile);
      if (faviconFile) formData.append('favicon', faviconFile);
      if (removeLogo) formData.append('remove_logo', '1');
      if (removeFavicon) formData.append('remove_favicon', '1');
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
      setRemoveLogo(false);
      setRemoveFavicon(false);
      loadData({ showLoading: false }).catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Unable to update settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = (type: 'tool' | 'category' | 'user' | 'post') => {
    if (type === 'tool') {
      setToolForm(defaultToolForm);
      setFormData(defaultToolForm);
      setSelectedTool(null);
      setToolImageFile(null);
    } else if (type === 'category') {
      setCategoryForm(defaultCategoryForm);
      setFormData(defaultCategoryForm);
      setSelectedCategory(null);
    } else if (type === 'user') {
      setUserForm(defaultUserForm);
      setFormData(defaultUserForm);
      setSelectedUser(null);
    } else if (type === 'post') {
      setPostForm(defaultPostForm);
      setFormData(defaultPostForm);
      setSelectedPost(null);
      setPostImageFile(null);
    }
    setFormModal({ isOpen: true, type, mode: 'create', data: { categories } });
  };

  const openEditModal = (type: 'tool' | 'category' | 'user' | 'post', item: any) => {
    if (type === 'tool') {
      setSelectedTool(item);
      setToolImageFile(null);
      setFormData({
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
        logo_alt: item.logo_alt || '',
        logo_title: item.logo_title || '',
        meta_title: item.meta_title || '',
        meta_description: item.meta_description || '',
        meta_keywords: item.meta_keywords || '',
        features: Array.isArray(item.features) ? item.features.join(', ') : '',
        pros: Array.isArray(item.pros) ? item.pros.join(', ') : '',
        cons: Array.isArray(item.cons) ? item.cons.join(', ') : '',
      });
    } else if (type === 'category') {
      setSelectedCategory(item);
      setFormData({
        name: item.name,
        slug: item.slug,
        description: item.description ?? '',
        icon: item.icon ?? '',
      });
    } else if (type === 'user') {
      setSelectedUser(item);
      setFormData({
        name: item.name,
        email: item.email,
        password: '',
      });
    } else if (type === 'post') {
      setSelectedPost(item);
      setFormData({
        title: item.title,
        slug: item.slug,
        type: item.type,
        category: item.category || '',
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
        excerpt: item.excerpt || '',
        image: item.image || '',
        remove_image: false,
        content: item.content || '',
        meta_title: item.meta_title || '',
        meta_description: item.meta_description || '',
        published: Boolean(item.published),
        published_at: item.published_at ? String(item.published_at).slice(0, 16) : '',
      });
      setPostImageFile(null);
    }
    setFormModal({ isOpen: true, type, mode: 'edit', data: { categories } });
  };

  const closeFormModal = () => {
    setFormModal({ isOpen: false, type: null, mode: 'create' });
    clearToolForm();
    clearCategoryForm();
    clearUserForm();
    clearPostForm();
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (formModal.type === 'tool') {
        const plainToolDescription = stripHtml(formData.description);
        if (!plainToolDescription) {
          setError('Tool description is required.');
          setSubmitting(false);
          return;
        }
        if (plainToolDescription.length > TOOL_DESCRIPTION_MAX) {
          setError(`Tool description must be ${TOOL_DESCRIPTION_MAX} characters or fewer.`);
          setSubmitting(false);
          return;
        }

        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('slug', formData.slug);
        payload.append('description', formData.description);
        payload.append('category_id', String(Number(formData.category_id)));
        payload.append('pricing', formData.pricing);
        payload.append('rating', String(parseFloat(formData.rating) || 0));
        payload.append('visit_url', formData.visit_url);
        payload.append('featured', formData.featured ? '1' : '0');
        payload.append('trending', formData.trending ? '1' : '0');
        payload.append('just_landed', formData.just_landed ? '1' : '0');
        payload.append('is_top', formData.is_top ? '1' : '0');
        payload.append('features', JSON.stringify(parseCsv(formData.features)));
        payload.append('pros', JSON.stringify(parseCsv(formData.pros)));
        payload.append('cons', JSON.stringify(parseCsv(formData.cons)));
        payload.append('logo_alt', formData.logo_alt || '');
        payload.append('logo_title', formData.logo_title || '');
        payload.append('meta_title', formData.meta_title || '');
        payload.append('meta_description', formData.meta_description || '');
        payload.append('meta_keywords', formData.meta_keywords || '');

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
        const plainCategoryDescription = stripHtml(formData.description);
        if (plainCategoryDescription.length > CATEGORY_DESCRIPTION_MAX) {
          setError(`Category description must be ${CATEGORY_DESCRIPTION_MAX} characters or fewer.`);
          setSubmitting(false);
          return;
        }

        const payload = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          icon: formData.icon || null,
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
          name: formData.name,
          email: formData.email,
        };

        if (formModal.mode === 'create') {
          await createUser({ ...payload, password: formData.password });
          toast.success('User created successfully.');
        } else if (formModal.mode === 'edit' && selectedUser) {
          await updateUser(selectedUser.id, payload);
          toast.success('User updated successfully.');
        }
      } else if (formModal.type === 'post') {
        const payload = new FormData();
        payload.append('title', formData.title);
        payload.append('slug', formData.slug || '');
        payload.append('type', formData.type);
        payload.append('category', formData.category || '');
        payload.append('tags', JSON.stringify(parseCsv(formData.tags)));
        payload.append('excerpt', formData.excerpt || '');
        payload.append('content', formData.content);
        payload.append('meta_title', formData.meta_title || '');
        payload.append('meta_description', formData.meta_description || '');
        payload.append('published', formData.published ? '1' : '0');
        payload.append('published_at', formData.published_at || '');
        payload.append('image_alt', formData.image_alt || '');
        payload.append('image_title', formData.image_title || '');
        if (postImageFile) {
          payload.append('image', postImageFile);
        }
        if (formData.remove_image) {
          payload.append('remove_image', '1');
        }

        if (selectedPost) {
          await updatePost(selectedPost.id, payload);
          toast.success('Post updated successfully.');
        } else {
          await createPost(payload);
          toast.success('Post created successfully.');
        }
      }

      closeFormModal();
      loadData({ showLoading: false }).catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Unable to save.');
    } finally {
      setSubmitting(false);
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
      image_alt: post.image_alt || '',
      image_title: post.image_title || '',
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
    setSubmitting(true);

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

      clearPostForm();
      loadData({ showLoading: false }).catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Unable to save post.');
    } finally {
      setSubmitting(false);
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
          // Get the post to extract image URLs
          const postToDelete = posts.find((p) => p.id === postId);
          
          // Extract image URLs from post content and featured image
          const imagesToDelete: string[] = [];
          
          // Add featured/header image
          if (postToDelete?.image && !postToDelete.image.startsWith('data:')) {
            imagesToDelete.push(postToDelete.image);
          }
          
          // Extract external images from content (exclude base64 images)
          if (postToDelete?.content) {
            const imgRegex = /src=["']([^"']+)["']/gi;
            let match;
            while ((match = imgRegex.exec(postToDelete.content)) !== null) {
              const imgUrl = match[1];
              // Only include non-base64 image URLs
              if (imgUrl && !imgUrl.startsWith('data:')) {
                imagesToDelete.push(imgUrl);
              }
            }
          }
          
          // Delete post (backend should handle image deletion)
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

  // Bulk delete functions
  const handleBulkDeleteTools = async () => {
    const toolIds = Array.from(selectedTools);
    if (toolIds.length === 0) return;

    setModal({
      isOpen: true,
      title: 'Delete Tools',
      message: `Are you sure you want to delete ${toolIds.length} tool${toolIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
      onConfirm: async () => {
        setModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setError('');
        setSuccess('');
        setLoading(true);
        try {
          await bulkDeleteTools(toolIds);
          toast.success(`${toolIds.length} tool${toolIds.length > 1 ? 's' : ''} deleted successfully.`);
          setSelectedTools(new Set());
          await loadData();
        } catch (err: any) {
          setError(err.message || 'Unable to delete tools.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleBulkDeleteCategories = async () => {
    const categoryIds = Array.from(selectedCategories);
    if (categoryIds.length === 0) return;

    setModal({
      isOpen: true,
      title: 'Delete Categories',
      message: `Are you sure you want to delete ${categoryIds.length} categor${categoryIds.length > 1 ? 'ies' : 'y'}? This action cannot be undone.`,
      onConfirm: async () => {
        setModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setError('');
        setSuccess('');
        setLoading(true);
        try {
          await bulkDeleteCategories(categoryIds);
          toast.success(`${categoryIds.length} categor${categoryIds.length > 1 ? 'ies' : 'y'} deleted successfully.`);
          setSelectedCategories(new Set());
          await loadData();
        } catch (err: any) {
          setError(err.message || 'Unable to delete categories.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleBulkDeletePosts = async () => {
    const postIds = Array.from(selectedPosts);
    if (postIds.length === 0) return;

    setModal({
      isOpen: true,
      title: 'Delete Posts',
      message: `Are you sure you want to delete ${postIds.length} post${postIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
      onConfirm: async () => {
        setModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setError('');
        setSuccess('');
        setLoading(true);
        try {
          await bulkDeletePosts(postIds);
          toast.success(`${postIds.length} post${postIds.length > 1 ? 's' : ''} deleted successfully.`);
          setSelectedPosts(new Set());
          await loadData();
        } catch (err: any) {
          setError(err.message || 'Unable to delete posts.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleBulkDeleteUsers = async () => {
    const userIds = Array.from(selectedUsers);
    // Filter out admin users
    const nonAdminUserIds = userIds.filter(id => {
      const user = users.find(u => u.id === id);
      return user && !user.is_admin;
    });
    
    if (nonAdminUserIds.length === 0) return;

    setModal({
      isOpen: true,
      title: 'Delete Users',
      message: `Are you sure you want to permanently delete ${nonAdminUserIds.length} user${nonAdminUserIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
      onConfirm: async () => {
        setModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setError('');
        setSuccess('');
        setLoading(true);
        try {
          await bulkDeleteUsers(nonAdminUserIds);
          toast.success(`${nonAdminUserIds.length} user${nonAdminUserIds.length > 1 ? 's' : ''} deleted successfully.`);
          setSelectedUsers(new Set());
          await loadData();
        } catch (err: any) {
          setError(err.message || 'Unable to delete users.');
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

  if (!authChecked) {
    return null;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#4f46e5',
            color: '#ffffff',
          },
        }}
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
                onClick={() => router.push(`/dashboard?tab=${tab}`)}
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
                {/* Welcome Header */}
                <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-8 text-white shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-indigo-100">Welcome to ToolNavix Dashboard</p>
                      <h1 className="mt-2 text-4xl font-bold">Analytics & Insights</h1>
                      <p className="mt-3 text-base text-indigo-100 max-w-2xl">Monitor your AI tool catalog, track platform engagement, measure content performance, and optimize your marketplace in real-time.</p>
                    </div>
                    <div className="text-6xl opacity-20">📊</div>
                  </div>
                </section>

                {/* Primary KPI Cards */}
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">Catalog Size</p>
                      <span className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5a2 2 0 00-1 .267" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-4xl font-bold text-slate-900">{stats.total_tools}</p>
                    <div className="mt-3 text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>{toolsByStatus.featured.length} Featured</span>
                        <span>{toolsByStatus.top.length} Top Rated</span>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('Tools')} className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                      Manage Tools →
                    </button>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">Community</p>
                      <span className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-4xl font-bold text-slate-900">{stats.total_users}</p>
                    <div className="mt-3 text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
                          {users.filter((user) => !user.banned).length} Active
                        </span>
                        <span>{users.filter((user) => user.banned).length} Banned</span>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('Users')} className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                      Manage Users →
                    </button>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">Engagement</p>
                      <span className="rounded-xl bg-cyan-100 p-3 text-cyan-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-4xl font-bold text-slate-900">{stats.total_views.toLocaleString()}</p>
                    <div className="mt-3 text-xs text-slate-600">
                      <span>Total tool views</span>
                    </div>
                    <button onClick={() => setActiveTab('Tools')} className="mt-4 inline-flex items-center text-sm font-semibold text-cyan-600 hover:text-cyan-700">
                      View Insights →
                    </button>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">Content</p>
                      <span className="rounded-xl bg-amber-100 p-3 text-amber-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-4xl font-bold text-slate-900">{posts.length}</p>
                    <div className="mt-3 text-xs text-slate-600 space-y-1">
                      <div>
                        {posts.filter(p => p.type === 'blog').length} Blog • {posts.filter(p => p.type === 'news').length} News
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('Content')} className="mt-4 inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-700">
                      Manage Content →
                    </button>
                  </article>
                </section>

                {/* Secondary Metrics */}
                <section className="grid gap-4 sm:grid-cols-3">
                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-900">Categories</h3>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{categories.length}</span>
                    </div>
                    <div className="space-y-2">
                      {categories.slice(0, 5).map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 truncate">{cat.name}</span>
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-medium">
                            {tools.filter(t => t.category?.id === cat.id).length}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setActiveTab('Categories')} className="mt-4 w-full py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                      View All Categories
                    </button>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-900">Tool Status</h3>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{stats.total_tools}</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: '⭐ Top Rated', value: toolsByStatus.top.length, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
                        { label: '✨ Featured', value: toolsByStatus.featured.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: '🔥 Trending', value: toolsByStatus.trending.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: '🆕 Just Landed', value: toolsByStatus.just_landed.length, color: 'text-amber-600', bg: 'bg-amber-50' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">{item.label}</span>
                          <span className={`font-semibold ${item.color} ${item.bg} px-2 py-1 rounded`}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-900">Platform Health</h3>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Healthy</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600">Catalog Completeness</span>
                          <span className="font-semibold text-slate-900">{Math.min(100, Math.round((stats.total_tools / 50) * 100))}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{width: `${Math.min(100, Math.round((stats.total_tools / 50) * 100))}%`}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600">Content Coverage</span>
                          <span className="font-semibold text-slate-900">{Math.round((posts.length / 20) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{width: `${Math.round((posts.length / 20) * 100)}%`}}></div>
                        </div>
                      </div>
                    </div>
                  </article>
                </section>

                {/* Main Content Grid */}
                <section className="grid gap-4 lg:grid-cols-3">
                  {/* Content Mix Chart */}
                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-slate-900">Catalog Distribution</h2>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Real-time</span>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: '⭐ Top AI Tools', value: toolsByStatus.top.length, color: 'bg-gradient-to-r from-fuchsia-500 to-pink-500', description: 'Highest rated tools' },
                        { label: '✨ Featured', value: toolsByStatus.featured.length, color: 'bg-gradient-to-r from-indigo-500 to-blue-500', description: 'Promoted tools' },
                        { label: '🔥 Trending', value: toolsByStatus.trending.length, color: 'bg-gradient-to-r from-emerald-500 to-teal-500', description: 'Currently popular' },
                        { label: '🆕 Just Landed', value: toolsByStatus.just_landed.length, color: 'bg-gradient-to-r from-amber-500 to-orange-500', description: 'Newly added' },
                      ].map((item) => {
                        const max = Math.max(1, stats.total_tools);
                        const width = Math.max(6, Math.round((item.value / max) * 100));
                        const percentage = Math.round((item.value / Math.max(1, stats.total_tools)) * 100);
                        return (
                          <div key={item.label}>
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                                <p className="text-xs text-slate-500">{item.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-base font-bold text-slate-900">{item.value}</p>
                                <p className="text-xs text-slate-500">{percentage}%</p>
                              </div>
                            </div>
                            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                              <div className={`h-full ${item.color}`} style={{ width: `${width}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>

                  {/* Quick Actions */}
                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                      <button 
                        onClick={() => router.push('/dashboard/tools')}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition font-medium text-sm"
                      >
                        <span className="text-lg">➕</span>
                        <span>Add New Tool</span>
                      </button>
                      <button 
                        onClick={() => router.push('/dashboard/content')}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition font-medium text-sm"
                      >
                        <span className="text-lg">✍️</span>
                        <span>Write Content</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('Categories')}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition font-medium text-sm"
                      >
                        <span className="text-lg">📂</span>
                        <span>Manage Categories</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('Tools')}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition font-medium text-sm"
                      >
                        <span className="text-lg">📊</span>
                        <span>View All Tools</span>
                      </button>
                    </div>
                  </article>
                </section>

                {/* Recent Activity & Featured Lists */}
                <section className="grid gap-4 lg:grid-cols-2">
                  {/* Trending Tools */}
                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-slate-900">🔥 Trending Now</h2>
                      <button onClick={() => setActiveTab('Tools')} className="text-xs font-semibold text-indigo-600 hover:underline">
                        View All →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {stats.trending_tools.slice(0, 6).map((tool, idx) => (
                        <div key={tool.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition cursor-pointer" onClick={() => router.push(`/dashboard/tools?id=${tool.id}`)}>
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-bold text-sm">
                            {idx + 1}
                          </span>
                          <span className="flex-1 text-sm font-medium text-slate-900 truncate">{tool.name}</span>
                          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Popular</span>
                        </div>
                      ))}
                      {stats.trending_tools.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-4">No trending tools yet</p>
                      )}
                    </div>
                  </article>

                  {/* New Tools */}
                  <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-slate-900">🆕 Recently Added</h2>
                      <button onClick={() => setActiveTab('Tools')} className="text-xs font-semibold text-emerald-600 hover:underline">
                        View All →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {stats.new_tools.slice(0, 6).map((tool, idx) => (
                        <div key={tool.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition cursor-pointer" onClick={() => router.push(`/dashboard/tools?id=${tool.id}`)}>
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold text-sm">
                            {idx + 1}
                          </span>
                          <span className="flex-1 text-sm font-medium text-slate-900 truncate">{tool.name}</span>
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">New</span>
                        </div>
                      ))}
                      {stats.new_tools.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-4">No new tools yet</p>
                      )}
                    </div>
                  </article>
                </section>

                {/* Content Stats */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900 mb-6">📝 Content Overview</h2>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                      <p className="text-xs uppercase tracking-[0.12em] text-blue-600 font-semibold mb-2">Blog Posts</p>
                      <p className="text-3xl font-bold text-blue-900">{posts.filter(p => p.type === 'blog').length}</p>
                      <p className="text-xs text-blue-700 mt-2">{posts.filter(p => p.type === 'blog' && p.published).length} published</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                      <p className="text-xs uppercase tracking-[0.12em] text-amber-600 font-semibold mb-2">AI News</p>
                      <p className="text-3xl font-bold text-amber-900">{posts.filter(p => p.type === 'news').length}</p>
                      <p className="text-xs text-amber-700 mt-2">{posts.filter(p => p.type === 'news' && p.published).length} published</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                      <p className="text-xs uppercase tracking-[0.12em] text-emerald-600 font-semibold mb-2">Guides</p>
                      <p className="text-3xl font-bold text-emerald-900">{posts.filter(p => p.type === 'guide').length}</p>
                      <p className="text-xs text-emerald-700 mt-2">{posts.filter(p => p.type === 'guide' && p.published).length} published</p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {activeTab === 'Tools' && (
              <section className="space-y-4">
                <FilterBar
                  filters={toolFilters}
                  onFilterChange={handleToolFiltersChange}
                  config={{
                    fields: [
                      { key: 'search', label: 'Search', type: 'text', placeholder: 'Tool name' },
                      { key: 'pricing', label: 'Pricing', type: 'select', options: [{ value: 'free', label: 'Free' }, { value: 'paid', label: 'Paid' }, { value: 'freemium', label: 'Freemium' }, { value: 'free_trial', label: 'Free Trial' }] },
                      { key: 'featured', label: 'Featured Only', type: 'checkbox' },
                      { key: 'trending', label: 'Trending Only', type: 'checkbox' },
                    ],
                  }}
                  onAddNew={() => router.push('/dashboard/tools')}
                  addNewLabel="Create Tools"
                />
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  {/* Bulk Actions */}
                  {selectedTools.size > 0 && (
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                          {selectedTools.size} tool{selectedTools.size > 1 ? 's' : ''} selected
                        </span>
                        <button
                          onClick={handleBulkDeleteTools}
                          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                          disabled={loading}
                        >
                          Delete Selected
                        </button>
                      </div>
                    </div>
                  )}
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={filteredTools.length > 0 && selectedTools.size === filteredTools.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTools(new Set(filteredTools.map(tool => tool.id)));
                              } else {
                                setSelectedTools(new Set());
                              }
                            }}
                            className="rounded border-slate-300"
                          />
                        </th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Pricing</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTools.map((tool) => (
                        <tr key={tool.id} className="border-t border-slate-200">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedTools.has(tool.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedTools);
                                if (e.target.checked) {
                                  newSelected.add(tool.id);
                                } else {
                                  newSelected.delete(tool.id);
                                }
                                setSelectedTools(newSelected);
                              }}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                {tool.logo ? (
                                  <img src={tool.logo} alt={tool.name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full animate-pulse bg-gradient-to-br from-slate-200 to-slate-300" />
                                )}
                              </div>
                              <span>{tool.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{tool.category?.name}</td>
                          <td className="px-4 py-3">{formatPricing(tool.pricing)}</td>
                          <td className="px-4 py-3">{statusText(tool)}</td>
                          <td className="px-4 py-3 space-x-2">
                            <button onClick={() => router.push(`/dashboard/tools?id=${tool.id}`)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200">Edit</button>
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
                <FilterBar
                  filters={categoryFilters}
                  onFilterChange={handleCategoryFiltersChange}
                  config={{
                    fields: [
                      { key: 'search', label: 'Search', type: 'text', placeholder: 'Category name' },
                    ],
                  }}
                  onAddNew={() => router.push('/dashboard/categories')}
                  addNewLabel="Create Category"
                />
                <div className="space-y-3">
                  {/* Bulk Actions */}
                  {selectedCategories.size > 0 && (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                          {selectedCategories.size} categor{selectedCategories.size > 1 ? 'ies' : 'y'} selected
                        </span>
                        <button
                          onClick={handleBulkDeleteCategories}
                          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                          disabled={loading}
                        >
                          Delete Selected
                        </button>
                      </div>
                    </div>
                  )}
                  {filteredCategories.length > 0 && (
                    <div className="rounded-3xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={filteredCategories.length > 0 && selectedCategories.size === filteredCategories.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories(new Set(filteredCategories.map((category) => category.id)));
                              } else {
                                setSelectedCategories(new Set());
                              }
                            }}
                            className="rounded border-slate-300"
                          />
                          Select all
                        </label>
                        <span className="text-sm text-slate-500">{filteredCategories.length} categor{filteredCategories.length > 1 ? 'ies' : 'y'}</span>
                      </div>
                      <div className="space-y-3 p-4">
                        {filteredCategories.map((category) => (
                          <div key={category.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedCategories.has(category.id)}
                                  onChange={(e) => {
                                    const newSelected = new Set(selectedCategories);
                                    if (e.target.checked) {
                                      newSelected.add(category.id);
                                    } else {
                                      newSelected.delete(category.id);
                                    }
                                    setSelectedCategories(newSelected);
                                  }}
                                  className="rounded border-slate-300"
                                />
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                  <i className={category.icon || 'bi bi-grid'} aria-hidden="true" />
                                </span>
                                <div>
                                  <p className="font-semibold text-slate-900">{category.name}</p>
                                  <p className="text-sm text-slate-500">{category.slug}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => router.push(`/dashboard/categories?id=${category.id}`)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200">Edit</button>
                                <button onClick={() => handleDeleteCategory(category.id)} className="rounded-lg bg-rose-100 px-3 py-1 text-sm text-rose-700 hover:bg-rose-200">Delete</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'Content' && (
              <section className="space-y-5">
                <div className="card">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Content Management</h2>
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

                <FilterBar
                  filters={postFilters}
                  onFilterChange={handlePostFiltersChange}
                  config={{
                    fields: [
                      { key: 'search', label: 'Search', type: 'text', placeholder: 'Post title' },
                      { key: 'type', label: 'Type', type: 'select', options: [{ value: 'blog', label: 'Blog' }, { value: 'news', label: 'AI News' }] },
                      { key: 'published', label: 'Published', type: 'select', options: [{ value: 'true', label: 'Published' }, { value: 'false', label: 'Draft' }] },
                    ],
                  }}
                  onAddNew={() => router.push('/dashboard/content')}
                  addNewLabel="New Post"
                />

                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  {/* Bulk Actions */}
                  {selectedPosts.size > 0 && (
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                          {selectedPosts.size} post{selectedPosts.size > 1 ? 's' : ''} selected
                        </span>
                        <button
                          onClick={handleBulkDeletePosts}
                          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                          disabled={loading}
                        >
                          Delete Selected
                        </button>
                      </div>
                    </div>
                  )}
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={filteredPosts.length > 0 && selectedPosts.size === filteredPosts.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPosts(new Set(filteredPosts.map(post => post.id)));
                              } else {
                                setSelectedPosts(new Set());
                              }
                            }}
                            className="rounded border-slate-300"
                          />
                        </th>
                        <th className="px-4 py-3">Post</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Published</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPosts.map((post) => (
                        <tr key={post.id} className="border-t border-slate-200">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedPosts.has(post.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedPosts);
                                if (e.target.checked) {
                                  newSelected.add(post.id);
                                } else {
                                  newSelected.delete(post.id);
                                }
                                setSelectedPosts(newSelected);
                              }}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                {post.image ? (
                                  <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full animate-pulse bg-gradient-to-br from-slate-200 to-slate-300" />
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
                            <button onClick={() => router.push(`/dashboard/content?id=${post.id}`)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200">Edit</button>
                            <button onClick={() => handleDeletePost(post.id)} className="rounded-lg bg-rose-100 px-3 py-1 text-sm text-rose-700 hover:bg-rose-200">Delete</button>
                          </td>
                        </tr>
                      ))}
                      {filteredPosts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No content found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </section>
              </section>
            )}

            {activeTab === 'Users' && (
              <section className="space-y-5">
                <FilterBar
                  filters={userFilters}
                  onFilterChange={handleUserFiltersChange}
                  config={{
                    fields: [
                      { key: 'search', label: 'Search', type: 'text', placeholder: 'Name or email' },
                      { key: 'admin', label: 'Role', type: 'select', options: [{ value: 'true', label: 'Admin' }, { value: 'false', label: 'Member' }] },
                    ],
                  }}
                  onAddNew={() => router.push('/dashboard/users')}
                  addNewLabel="New User"
                />

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  {/* Bulk Actions */}
                  {selectedUsers.size > 0 && (
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                          {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
                        </span>
                        <button
                          onClick={handleBulkDeleteUsers}
                          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                          disabled={loading}
                        >
                          Delete Selected
                        </button>
                      </div>
                    </div>
                  )}
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={filteredUsers.filter(u => !u.is_admin).length > 0 && selectedUsers.size === filteredUsers.filter(u => !u.is_admin).length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(new Set(filteredUsers.filter(u => !u.is_admin).map(user => user.id)));
                              } else {
                                setSelectedUsers(new Set());
                              }
                            }}
                            className="rounded border-slate-300"
                          />
                        </th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-t border-slate-200">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedUsers.has(user.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedUsers);
                                if (e.target.checked) {
                                  newSelected.add(user.id);
                                } else {
                                  newSelected.delete(user.id);
                                }
                                setSelectedUsers(newSelected);
                              }}
                              disabled={user.is_admin}
                              className="rounded border-slate-300 disabled:opacity-50"
                            />
                          </td>
                          <td className="px-4 py-3">{user.name}</td>
                          <td className="px-4 py-3">{user.email}</td>
                          <td className="px-4 py-3">{user.is_admin ? 'Admin' : 'Member'}</td>
                          <td className="px-4 py-3">{user.banned ? 'Banned' : 'Active'}</td>
                          <td className="px-4 py-3 space-x-2">
                            <button onClick={() => router.push(`/dashboard/users?id=${user.id}`)} className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200">Edit</button>
                            {!user.is_admin && (
                              <button onClick={() => handleDeleteUser(user.id)} className="rounded-lg bg-rose-100 px-3 py-1 text-sm text-rose-700 hover:bg-rose-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No users found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'Settings' && (
              <section className="space-y-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-8">
                  <h2 className="mb-6 text-xl font-semibold text-slate-900">Current Branding</h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">Current Logo</span>
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
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">Current Favicon</span>
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

                <form onSubmit={handleSettingsSubmit} className="space-y-8">
                  <div className="rounded-2xl border border-slate-200 bg-white p-8">
                    <h2 className="mb-6 text-xl font-semibold text-slate-900">Branding Assets</h2>
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Logo</label>
                        <div className="mt-2">
                          <ImageUpload
                            currentImage={settings.logo_url}
                            onImageSelect={(file) => {
                              setLogoFile(file);
                              setRemoveLogo(false);
                            }}
                            onImageRemove={() => {
                              setLogoFile(null);
                              setRemoveLogo(true);
                              setSettings((prev) => prev ? { ...prev, logo_url: '' } : prev);
                            }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Recommended: 512x512px</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Favicon</label>
                        <div className="mt-2">
                          <ImageUpload
                            currentImage={settings.favicon_url}
                            onImageSelect={(file) => {
                              setFaviconFile(file);
                              setRemoveFavicon(false);
                            }}
                            onImageRemove={() => {
                              setFaviconFile(null);
                              setRemoveFavicon(true);
                              setSettings((prev) => prev ? { ...prev, favicon_url: '' } : prev);
                            }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Recommended: 256x256px or 64x64px</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Footer Text</label>
                      <textarea
                        value={settings.footer_text || ''}
                        onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        rows={2}
                        placeholder="© 2026 ToolNavix. All rights reserved."
                      />
                      <p className="mt-1 text-xs text-slate-500">This text appears in the website footer.</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-8">
                    <h2 className="mb-6 text-xl font-semibold text-slate-900">Homepage Hero Content</h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Hero Badge</label>
                        <input
                          value={settings.hero_badge || ''}
                          onChange={(e) => setSettings({ ...settings, hero_badge: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          placeholder="AI tools marketplace"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Search Button Text</label>
                        <input
                          value={settings.hero_search_button_text || ''}
                          onChange={(e) => setSettings({ ...settings, hero_search_button_text: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          placeholder="AI Search"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Hero Title</label>
                      <textarea
                        value={settings.hero_title || ''}
                        onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        rows={2}
                        placeholder="Find the exact AI tool you need, instantly"
                      />
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Hero Subtitle</label>
                      <textarea
                        value={settings.hero_subtitle || ''}
                        onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        rows={3}
                        placeholder="Search, compare and bookmark AI tools..."
                      />
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Search Placeholder</label>
                      <input
                        value={settings.hero_search_placeholder || ''}
                        onChange={(e) => setSettings({ ...settings, hero_search_placeholder: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="Search AI tools by use case..."
                      />
                    </div>

                    <div className="mt-6 grid gap-6 sm:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tag 1</label>
                        <input
                          value={settings.hero_tag_1 || ''}
                          onChange={(e) => setSettings({ ...settings, hero_tag_1: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          placeholder="YouTube tools"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tag 2</label>
                        <input
                          value={settings.hero_tag_2 || ''}
                          onChange={(e) => setSettings({ ...settings, hero_tag_2: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          placeholder="AI editors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tag 3</label>
                        <input
                          value={settings.hero_tag_3 || ''}
                          onChange={(e) => setSettings({ ...settings, hero_tag_3: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          placeholder="Script generators"
                        />
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Leave any field empty to use default homepage text.</p>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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

      {/* Form Modal */}
      <FormModal
        isOpen={formModal.isOpen}
        type={formModal.type}
        mode={formModal.mode}
        data={formModal.data}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
        formData={formData}
        setFormData={setFormData}
        submitting={submitting}
        imageFile={formModal.type === 'post' ? postImageFile : toolImageFile}
        setImageFile={formModal.type === 'post' ? setPostImageFile : setToolImageFile}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </>
  );
}
