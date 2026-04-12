'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { fetchCategories } from '../lib/api';

type Category = {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => []);
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(to_bottom,_#f8fafc,_#ffffff_40%,_#f1f5f9)] py-10">
        <div className="container space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/60 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Search by Domain</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">AI Categories</h1>
            <p className="mt-2 text-sm text-slate-600">Jump into curated category clusters and discover the best tools by use case.</p>
          </section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link key={category.id} href={`/categories/${category.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <i className={category.icon || 'bi bi-grid'} aria-hidden="true" />
                </div>
                <h2 className="font-semibold text-slate-900">{category.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{category.description || 'Explore tools in this category.'}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.1em] text-indigo-600">
                  Explore
                  <i className="bi bi-arrow-right transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
