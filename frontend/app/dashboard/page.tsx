'use client';

import { useEffect, useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
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
  approveReview,
  banUser,
  updateCategory,
  updateTool,
  updateUser,
  fetchSettings,
  updateSettings,
} from '../lib/api';

const tabs = ['Overview', 'Tools', 'Categories', 'Users', 'Reviews', 'Settings'] as const;
type Tab = (typeof tabs)[number];

type Stats = {
  total_tools: number;
  total_users: number;
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
  visit_url: string;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
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
  features: '',
  pros: '',
  cons: '',
};

const defaultCategoryForm = {
  name: '',
  slug: '',
  description: '',
};

const defaultUserForm = {
  name: '',
  email: '',
  password: '',
};

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

const FormModal = ({ isOpen, type, mode, data, onClose, onSubmit, formData, setFormData, loading }: {
  isOpen: boolean;
  type: 'tool' | 'category' | 'user' | null;
  mode: 'create' | 'edit';
  data?: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  loading: boolean;
}) => {
  if (!isOpen || !type) return null;

  const title = mode === 'create' ? `Create ${type === 'tool' ? 'Tool' : type === 'category' ? 'Category' : 'User'}` : `Edit ${type === 'tool' ? 'Tool' : type === 'category' ? 'Category' : 'User'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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
                  <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" required />
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
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2" rows={4} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
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
                <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea value={formData.description ?? ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2" rows={4} />
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
    </div>
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
  const [toolForm, setToolForm] = useState(defaultToolForm);
  const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);
  const [userForm, setUserForm] = useState(defaultUserForm);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<Settings>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [formModal, setFormModal] = useState<FormModalState>({ isOpen: false, type: null, mode: 'create' });

  const statusText = (tool: Tool) => {
    if (tool.featured) return 'Featured';
    if (tool.trending) return 'Trending';
    if (tool.just_landed) return 'Just Landed';
    return 'Standard';
  };

  const loadData = async () => {
    setError('');
    setLoading(true);
    try {
      const [statsData, toolsData, categoriesData, usersData, reviewsData, settingsData] = await Promise.all([
        fetchDashboardStats(),
        fetchTools({ per_page: '50' }),
        fetchCategories(),
        fetchDashboardUsers(),
        fetchDashboardReviews(),
        fetchSettings(),
      ]);

      setStats(statsData);
      setTools(toolsData.data ?? []);
      setCategories(categoriesData);
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
  };

  const clearCategoryForm = () => {
    setSelectedCategory(null);
    setCategoryForm(defaultCategoryForm);
  };

  const clearUserForm = () => {
    setSelectedUser(null);
    setUserForm(defaultUserForm);
  };

  const parseCsv = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

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
      setToolForm({
        name: item.name,
        slug: item.slug,
        description: item.description,
        category_id: String(item.category?.id ?? ''),
        pricing: item.pricing,
        rating: String(item.rating),
        visit_url: item.visit_url,
        featured: item.featured,
        trending: item.trending,
        just_landed: item.just_landed,
        features: '',
        pros: '',
        cons: '',
      });
    } else if (type === 'category') {
      setSelectedCategory(item);
      setCategoryForm({
        name: item.name,
        slug: item.slug,
        description: item.description ?? '',
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
        const payload = {
          name: toolForm.name,
          slug: toolForm.slug,
          description: toolForm.description,
          category_id: Number(toolForm.category_id),
          pricing: toolForm.pricing,
          rating: parseFloat(toolForm.rating) || 0,
          visit_url: toolForm.visit_url,
          featured: toolForm.featured,
          trending: toolForm.trending,
          just_landed: toolForm.just_landed,
          features: JSON.stringify(parseCsv(toolForm.features)),
          pros: JSON.stringify(parseCsv(toolForm.pros)),
          cons: JSON.stringify(parseCsv(toolForm.cons)),
        };

        if (formModal.mode === 'edit' && selectedTool) {
          await updateTool(selectedTool.id, payload);
          toast.success('Tool updated successfully.');
        } else {
          await createTool(payload);
          toast.success('Tool created successfully.');
        }
      } else if (formModal.type === 'category') {
        const payload = {
          name: categoryForm.name,
          slug: categoryForm.slug,
          description: categoryForm.description,
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

  const toolsByStatus = useMemo(() => ({
    trending: tools.filter((tool) => tool.trending),
    featured: tools.filter((tool) => tool.featured),
    just_landed: tools.filter((tool) => tool.just_landed),
  }), [tools]);

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
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading dashboard...</div>;
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
      <FormModal
        isOpen={formModal.isOpen}
        type={formModal.type}
        mode={formModal.mode}
        data={formModal.data}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
        formData={formModal.type === 'tool' ? toolForm : formModal.type === 'category' ? categoryForm : userForm}
        setFormData={formModal.type === 'tool' ? setToolForm : formModal.type === 'category' ? setCategoryForm : setUserForm}
        loading={loading}
      />
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-6">
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
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="card">
                  <h2 className="text-xs uppercase tracking-wide text-slate-500">Total tools</h2>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total_tools}</p>
                </div>
                <div className="card">
                  <h2 className="text-xs uppercase tracking-wide text-slate-500">Total users</h2>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total_users}</p>
                </div>
                <div className="card">
                  <h2 className="text-xs uppercase tracking-wide text-slate-500">Reviews pending</h2>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{reviews.filter((review) => !review.approved).length}</p>
                </div>
                <div className="card sm:col-span-2">
                  <h2 className="text-xs uppercase tracking-wide text-slate-500">Trending tools</h2>
                  <ul className="mt-3 list-disc list-inside text-sm text-slate-700">
                    {stats.trending_tools.map((tool) => <li key={tool.id}>{tool.name}</li>)}
                  </ul>
                </div>
                <div className="card sm:col-span-1">
                  <h2 className="text-xs uppercase tracking-wide text-slate-500">New tools</h2>
                  <ul className="mt-3 list-disc list-inside text-sm text-slate-700">
                    {stats.new_tools.map((tool) => <li key={tool.id}>{tool.name}</li>)}
                  </ul>
                </div>
              </div>
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
                          <td className="px-4 py-3">{tool.name}</td>
                          <td className="px-4 py-3">{tool.category?.name}</td>
                          <td className="px-4 py-3">{tool.pricing}</td>
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
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div key={category.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{category.name}</p>
                          <p className="text-sm text-slate-500">{category.slug}</p>
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
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading || (!logoFile && !faviconFile)}
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
