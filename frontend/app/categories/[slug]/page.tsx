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

  useEffect(() => {
    if (!slug) return;
    fetchCategoryTools(slug)
      .then((res) => {
        setCategoryName(res.category?.name || 'Category');
        setTools(res.tools?.data ?? []);
      })
      .catch(() => {
        setCategoryName('Category');
        setTools([]);
      });
  }, [slug]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 py-10">
        <div className="container">
          <h1 className="mb-6 text-3xl font-bold text-slate-900">{categoryName} Tools</h1>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <article key={tool.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="aspect-[16/9] bg-slate-100">{tool.logo ? <img src={tool.logo} alt={tool.name} className="h-full w-full object-cover" /> : null}</div>
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
        </div>
      </main>
    </>
  );
}
