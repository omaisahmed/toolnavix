'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from './Header';
import { stripHtml } from '../lib/richText';
import SaveToolButton from './SaveToolButton';

type Tool = {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo?: string | null;
  pricing: string;
  rating: number;
  category?: { name?: string };
};

type ToolFeedPageProps = {
  title: string;
  subtitle: string;
  fetcher: (params: Record<string, string>) => Promise<any>;
};

function toShortDescription(value?: string, max = 120) {
  const plain = stripHtml(value);
  if (!plain) return 'No description available.';
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}...` : plain;
}

export default function ToolFeedPage({ title, subtitle, fetcher }: ToolFeedPageProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Only show loading state after 300ms to avoid flashing on initial load
    const loadingTimer = setTimeout(() => setShowLoadingState(true), 300);
    
    fetcher({ page: String(page), per_page: '12' })
      .then((res) => {
        setTools(res.data ?? []);
        setLastPage(res.last_page ?? 1);
      })
      .finally(() => {
        setLoading(false);
        setShowLoadingState(false);
        clearTimeout(loadingTimer);
      });
      
    return () => clearTimeout(loadingTimer);
  }, [fetcher, page]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 py-10">
        <div className="container space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          </section>

          {showLoadingState ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200" />)}
            </div>
          ) : tools.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">No tools found.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <article key={tool.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative aspect-[16/9] bg-slate-100">
                    <SaveToolButton toolId={tool.id} variant="overlay" />
                    {tool.logo ? (
                      <img src={tool.logo} alt={tool.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full animate-pulse bg-gradient-to-br from-slate-200 to-slate-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <Link href={`/tools/${tool.slug}`} className="line-clamp-2 break-words text-xl font-bold text-slate-900 hover:text-indigo-600">
                      {tool.name}
                    </Link>
                    <p className="mt-2 min-h-[60px] break-words whitespace-normal text-sm leading-6 text-slate-600">
                      {toShortDescription(tool.description)}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">{tool.category?.name || 'Uncategorized'}</span>
                      <span className="font-semibold text-indigo-700">{tool.pricing}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Previous</button>
            <span className="text-sm text-slate-600">Page {page} / {lastPage}</span>
            <button disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      </main>
    </>
  );
}
