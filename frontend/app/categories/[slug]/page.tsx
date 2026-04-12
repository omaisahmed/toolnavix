'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../components/Header';
import { fetchCategoryTools } from '../../lib/api';
import { stripHtml } from '../../lib/richText';
import SaveToolButton from '../../components/SaveToolButton';

type Tool = {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo?: string | null;
  pricing: string;
  category?: { name?: string };
};

export default function CategoryToolsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || '';

  const [categoryName, setCategoryName] = useState('Category');
  const [tools, setTools] = useState<Tool[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    fetchCategoryTools(slug, { page: String(page), per_page: '12' })
      .then((res) => {
        setCategoryName(res.category?.name || 'Category');
        setTools(res.tools?.data ?? []);
        setLastPage(res.tools?.last_page ?? 1);
      })
      .catch(() => {
        setCategoryName('Category');
        setTools([]);
        setLastPage(1);
      });
  }, [slug, page]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_28%),linear-gradient(to_bottom,_#f8fafc,_#ffffff_40%,_#f1f5f9)] py-10">
        <div className="container space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/60 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Category Cluster</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{categoryName} Tools</h1>
            <p className="mt-2 text-sm text-slate-600">Browse the latest tools in this category and jump into full profiles.</p>
          </section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <article key={tool.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                <Link href={`/tools/${tool.slug}`} className="block aspect-[16/9] bg-slate-100" aria-label={`Open ${tool.name}`}>
                  {tool.logo ? (
                    <img src={tool.logo} alt={tool.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-gradient-to-br from-slate-200 to-slate-300" />
                  )}
                </Link>
                <div className="p-4">
                  <Link href={`/tools/${tool.slug}`} className="line-clamp-2 text-lg font-bold text-slate-900 hover:text-indigo-600">{tool.name}</Link>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{stripHtml(tool.description)}</p>
                  <div className="mt-3 flex justify-end">
                    <SaveToolButton toolId={tool.id} />
                  </div>
                </div>
              </article>
            ))}
          </div>
          {tools.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">No tools found in this category.</p>}
          {tools.length > 0 && (
            <div className="mt-6 flex items-center justify-center gap-3">
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
          )}
        </div>
      </main>
    </>
  );
}
