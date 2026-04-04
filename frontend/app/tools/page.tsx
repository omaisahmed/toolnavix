'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { fetchTools, fetchCategories } from '../lib/api';
import Header from '../components/Header';

type Tool = {
  id: number;
  name: string;
  slug: string;
  description: string;
  pricing: string;
  rating: number;
  category: { name: string; slug: string };
};

function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [error, setError] = useState('');

  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams?.get('category') ?? '';
  const pricing = searchParams?.get('pricing') ?? '';
  const rating = searchParams?.get('rating') ?? '';
  const sort = searchParams?.get('sort') ?? '';
  const search = searchParams?.get('search') ?? '';

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/tools?${params.toString()}`);
  };

  useEffect(() => {
    const params: Record<string, string> = {};

    if (category) params.category = category;
    if (pricing) params.pricing = pricing;
    if (rating) params.rating = rating;
    if (sort) params.sort = sort;
    if (search) params.search = search;

    fetchTools(params)
      .then((toolsData) => setTools(toolsData.data ?? toolsData))
      .catch(() => setError('Failed to load tools.'));

    fetchCategories()
      .then((data) => setCategoriesData(data))
      .catch(() => setError('Failed to load categories.'));
  }, [category, pricing, rating, sort, search]);

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <>
      <Header />
      <div className="min-h-[80vh] bg-slate-50 py-10">
        <div className="container">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Tool Directory</h1>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="card">
            <h2 className="font-semibold text-slate-800 mb-4">Filter</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-600">Category</label>
                <select
                  value={category}
                  onChange={(e) => updateFilters('category', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  <option value="">All</option>
                  {categoriesData.map((cat: any) => (
                    <option value={cat.slug} key={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Pricing</label>
                <select
                  value={pricing}
                  onChange={(e) => updateFilters('pricing', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  <option value="">All</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="freemium">Freemium</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => updateFilters('rating', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  <option value="">All</option>
                  <option value="4">4+</option>
                  <option value="4.5">4.5+</option>
                  <option value="5">5.0</option>
                </select>
              </div>
            </div>
          </aside>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-500">Sort:</label>
                <select
                  value={sort}
                  onChange={(e) => updateFilters('sort', e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="trending">Trending</option>
                  <option value="new">New</option>
                  <option value="top-rated">Top rated</option>
                </select>
                {(category || pricing || rating || search) && (
                  <button
                    onClick={() => router.push('/tools')}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
              {search && (
                <div className="text-sm text-slate-600">
                  Showing results for: <span className="font-medium">"{search}"</span>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <article key={tool.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">{tool.name}</h3>
                    <div className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-600">{tool.pricing}</div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{tool.description}</p>
                  <p className="mt-3 text-sm text-amber-500">{'★'.repeat(Math.round(tool.rating))}</p>
                  <Link href={`/tools/${tool.slug}`} className="mt-3 inline-block text-indigo-600 hover:underline">View details</Link>
                </article>
              ))}
            </div>

            {tools.length === 0 && (
              <div className="mt-12 text-center">
                <p className="text-slate-500 mb-2">
                  {search ? `No tools found for "${search}"` : 'No tools found'}
                </p>
                {search && (
                  <Link href="/tools" className="text-indigo-600 hover:underline">
                    Clear search and show all tools
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
    </>
  );
}

function ToolsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] bg-slate-50 py-10"><div className="container"><p className="text-center">Loading...</p></div></div>}>
      <ToolsPage />
    </Suspense>
  );
}

export default ToolsPageWrapper;
