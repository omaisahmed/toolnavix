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
      <main className="min-h-screen bg-slate-50 py-10">
        <div className="container">
          <h1 className="mb-6 text-3xl font-bold text-slate-900">Categories</h1>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link key={category.id} href={`/categories/${category.slug}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <i className={category.icon || 'bi bi-grid'} aria-hidden="true" />
                </div>
                <h2 className="font-semibold text-slate-900">{category.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{category.description || 'Explore tools in this category.'}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

