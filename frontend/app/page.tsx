'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchTools, fetchCategories } from './lib/api';
import Header from './components/Header';

type HomepageTool = {
  id: number;
  slug: string;
  name: string;
  description?: string;
  pricing: string;
  rating: number;
  featured: boolean;
  trending: boolean;
  just_landed: boolean;
  category: { name: string; slug: string };
};

type Category = {
  id: number;
  name: string;
  slug: string;
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tools, setTools] = useState<HomepageTool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function loadHomepageData() {
      try {
        const [toolsData, categoriesData] = await Promise.all([
          fetchTools({ per_page: '12' }),
          fetchCategories(),
        ]);

        setTools(toolsData.data ?? toolsData);
        setCategories(categoriesData);
      } catch (err) {
        setError('Unable to load homepage data.');
      } finally {
        setLoading(false);
      }
    }

    loadHomepageData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tools?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <Header />

      <section className="container py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">AI tools marketplace</p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Find the exact AI tool you need, instantly</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">Search, compare and bookmark AI tools with Smart AI search, categories, and personalized collections.</p>

          <form onSubmit={handleSearch} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AI tools by use case (e.g. create YouTube videos)"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <button type="submit" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 whitespace-nowrap">AI Search</button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1">YouTube tools</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">AI editors</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">Script generators</span>
          </div>
        </div>
      </section>

      <section className="container pb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-slate-900">Just Landed</h2>
          <Link href="/tools?filter=just_landed" className="text-indigo-600 hover:underline">Explore all</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.filter((tool) => tool.just_landed).map((tool) => (
            <article key={tool.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">{tool.name}</h3>
                <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-700">{tool.pricing}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{tool.category?.name ?? ''}</p>
              <p className="mt-3 text-sm text-slate-600">{tool.rating} ★</p>
              <Link href={`/tools/${tool.slug}`} className="mt-3 inline-block text-indigo-600 hover:underline">View detail</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="container pb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-slate-900">Trending tools</h2>
          <Link href="/tools?filter=trending" className="text-indigo-600 hover:underline">See all</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.filter((tool) => tool.trending).map((tool) => (
            <article key={tool.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">{tool.name}</h3>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">Trending</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{tool.category?.name ?? ''}</p>
              <p className="mt-3 text-sm text-slate-600">{tool.rating} ★</p>
              <Link href={`/tools/${tool.slug}`} className="mt-3 inline-block text-indigo-600 hover:underline">View detail</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="container pb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-slate-900">Featured tools</h2>
          <Link href="/tools?filter=featured" className="text-indigo-600 hover:underline">Browse all</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.filter((tool) => tool.featured).map((tool) => (
            <article key={tool.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">{tool.name}</h3>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">Featured</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{tool.category?.name ?? ''}</p>
              <p className="mt-3 text-sm text-slate-600">{tool.rating} ★</p>
              <Link href={`/tools/${tool.slug}`} className="mt-3 inline-block text-indigo-600 hover:underline">View detail</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="container pb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-5">Explore top categories</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.slug} href={`/tools?category=${category.slug}`} className="card flex items-center justify-center text-center font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition" >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="container mb-16 rounded-3xl bg-indigo-600 text-white p-10 shadow-xl">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold">Start scaling your AI workflow today</h2>
            <p className="mt-3 text-slate-100">Sign up to save tools, build collections and discover trends in minutes.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/register" className="rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700">Create account</Link>
            <Link href="/login" className="rounded-xl border border-white px-6 py-3 text-white">Log in</Link>
          </div>
        </div>
      </section>
      <footer className="border-t border-slate-200 bg-white py-7">
        <div className="container flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-slate-600">
          <p>© {new Date().getFullYear()} ToolNavix. All rights reserved.</p>
          {/* <div className="flex gap-3">
            <Link href="/">Home</Link>
            <a href="/sitemap.xml" className="hover:text-indigo-600">Sitemap</a>
            <a href="/robots.txt" className="hover:text-indigo-600">robots.txt</a>
          </div> */}
        </div>
      </footer>
    </main>
  );
}
