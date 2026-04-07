'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { fetchCategories, fetchTools } from '../lib/api';
import { stripHtml } from '../lib/richText';
import SaveToolButton from '../components/SaveToolButton';

type Tool = {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo?: string | null;
  pricing: string;
  rating: number;
  category?: { name?: string; slug?: string };
};

type Category = { id: number; name: string; slug: string };

function toShortDescription(value?: string, max = 120) {
  const plain = stripHtml(value);
  if (!plain) return 'No description available.';
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}...` : plain;
}

export default function BrowseAllPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [category, setCategory] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [pricing, setPricing] = useState('');
  const [rating, setRating] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => []);
  }, []);

  useEffect(() => {
    setLoading(true);
    // Only show loading state after 300ms to avoid flashing on initial load
    const loadingTimer = setTimeout(() => setShowLoadingState(true), 300);
    
    fetchTools({
      page: String(page),
      category,
      pricing,
      rating,
      search,
      per_page: '12',
    })
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
  }, [page, category, pricing, rating, search]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 py-10">
        <div className="container space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">Browse All Tools</h1>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <input value={searchInput} onChange={(e) => { setPage(1); setSearchInput(e.target.value); }} placeholder="Search tools..." className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <div className="relative">
                <input
                  type="text"
                  value={categoryInput || categories.find((c) => c.slug === category)?.name || ''}
                  onChange={(e) => {
                    setPage(1);
                    setCategory('');
                    setCategoryInput(e.target.value);
                    setCategoryDropdownOpen(true);
                  }}
                  onFocus={() => setCategoryDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setCategoryDropdownOpen(false), 120)}
                  placeholder="Search category..."
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm w-full"
                  autoComplete="off"
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
                            setCategory(c.slug);
                            setCategoryInput(c.name);
                            setCategoryDropdownOpen(false);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {c.name}
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-xs text-slate-500">No matching categories</p>
                    )}
                  </div>
                )}
              </div>
              <select value={pricing} onChange={(e) => { setPage(1); setPricing(e.target.value); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="">All pricing</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="freemium">Freemium</option>
                <option value="free_trial">Free trial</option>
              </select>
              <select value={rating} onChange={(e) => { setPage(1); setRating(e.target.value); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="">Any rating</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5</option>
              </select>
            </div>
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
                    <Link href={`/tools/${tool.slug}`} className="line-clamp-2 text-xl font-bold text-slate-900 hover:text-indigo-600">{tool.name}</Link>
                    <p className="mt-2 break-words whitespace-normal text-sm text-slate-600">{toShortDescription(tool.description)}</p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">{tool.category?.name || 'Uncategorized'}</span>
                      <span className="font-semibold text-indigo-700">{tool.pricing}</span>
                    </div>
                    <div className="mt-3 flex justify-end">
                        <SaveToolButton toolId={tool.id} variant="overlay" />
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
