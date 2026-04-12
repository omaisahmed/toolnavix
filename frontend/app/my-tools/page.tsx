'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { fetchSavedTools, removeSavedTool } from '../lib/api';
import toast from 'react-hot-toast';

type SavedTool = {
  id: number;
  tool?: {
    id: number;
    name: string;
    slug: string;
    logo?: string | null;
    pricing: string;
    category?: { name?: string };
  };
};

export default function MyToolsPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<SavedTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const loadSaved = async (targetPage = 1) => {
    setLoading(true);
    // Only show loading state after 300ms to avoid flashing on initial load
    const loadingTimer = setTimeout(() => setShowLoadingState(true), 300);
    
    try {
      const data = await fetchSavedTools(targetPage);
      setSaved(data.data ?? []);
      setLastPage(data.last_page ?? 1);

      if ((data.last_page ?? 1) > 0 && targetPage > (data.last_page ?? 1)) {
        setPage(data.last_page);
      }
    } catch {
      setSaved([]);
      setLastPage(1);
    } finally {
      setLoading(false);
      setShowLoadingState(false);
      clearTimeout(loadingTimer);
    }
  };

  useEffect(() => {
    const token = window.localStorage.getItem('toolnavix_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    loadSaved(page);
  }, [router, page]);

  const handleRemove = async (savedId: number) => {
    try {
      await removeSavedTool(savedId);
      toast.success('Removed from My Tools');
      const remainingOnPage = saved.length - 1;
      if (remainingOnPage <= 0 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        loadSaved(page);
      }
    } catch {
      toast.error('Unable to remove item');
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 py-10">
        <div className="container">
          <h1 className="mb-6 text-3xl font-bold text-slate-900">My Tools</h1>
          {showLoadingState ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200" />)}
            </div>
          ) : saved.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">No saved tools yet.</div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {saved.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <Link href={`/tools/${item.tool?.slug}`} className="block aspect-[16/9] overflow-hidden rounded-lg bg-slate-100" aria-label={`Open ${item.tool?.name || 'tool'}`}>
                      {item.tool?.logo ? (
                        <img src={item.tool.logo} alt={item.tool.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full animate-pulse bg-gradient-to-br from-slate-200 to-slate-300" />
                      )}
                    </Link>
                    <h2 className="mt-3 text-lg font-bold text-slate-900">{item.tool?.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{item.tool?.category?.name || 'Uncategorized'}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <Link href={`/tools/${item.tool?.slug}`} className="text-sm font-medium text-indigo-600 hover:underline">View</Link>
                      <button onClick={() => handleRemove(item.id)} className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-700">Remove</button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">Page {page} / {lastPage}</span>
                <button
                  disabled={page >= lastPage}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
