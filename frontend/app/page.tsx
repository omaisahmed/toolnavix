'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchTools, fetchCategories } from './lib/api';
import Header from './components/Header';
import SaveToolButton from './components/SaveToolButton';
import { stripHtml } from './lib/richText';
import { useSettings } from './context/SettingsContext';

type HomepageTool = {
  id: number;
  slug: string;
  name: string;
  description?: string;
  logo?: string | null;
  visit_url: string;
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
  icon?: string | null;
};

function toShortDescription(value?: string, max = 120): string {
  if (!value) return 'No description available.';
  const plain = stripHtml(value);
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max).trimEnd()}...`;
}

function ToolCard({ tool, badge }: { tool: HomepageTool; badge: string }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        <SaveToolButton toolId={tool.id} variant="overlay" />
        {tool.logo ? (
          <img src={tool.logo} alt={tool.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full animate-pulse bg-gradient-to-br from-slate-200 to-slate-300" />
        )}
        {/* <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow">
          {badge}
        </span> */}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/tools/${tool.slug}`} className="min-w-0 flex-1 text-sm font-semibold text-indigo-600">
            <h3 className="line-clamp-2 break-words text-2xl font-bold leading-tight text-slate-900">{tool.name}</h3>
          </Link>
          <a
            href={tool.visit_url}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-700 hover:text-indigo-800"
            aria-label={`Visit ${tool.name}`}
          >
            <i className="bi bi-box-arrow-up-right ms-1 small" aria-hidden="true" />
          </a>
        </div>

        <p className="mt-3 line-clamp-3 min-h-[72px] break-words text-base leading-6 text-slate-700">
          {toShortDescription(tool.description)}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            {tool.category?.name || 'Uncategorized'}
          </span>
          <div className="text-right">
            {/* <p className="text-xs text-slate-500">{tool.rating.toFixed(1)} / 5</p> */}
            <p className="text-sm font-semibold text-indigo-700">{tool.pricing}</p>
          </div>
        </div>
        {/* <Link href={`/tools/${tool.slug}`} className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline">
          View details
        </Link> */}
      </div>
    </article>
  );
}

function ToolSection({
  title,
  browseHref,
  browseLabel,
  badge,
  tools,
}: {
  title: string;
  browseHref: string;
  browseLabel: string;
  badge: string;
  tools: HomepageTool[];
}) {
  return (
    <section className="container pb-12">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <Link href={browseHref} className="text-indigo-600 hover:underline">{browseLabel}</Link>
      </div>

      {tools.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} badge={badge} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No tools available in this section yet.
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tools, setTools] = useState<HomepageTool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [showToolsLoading, setShowToolsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const settings = useSettings();
  
  const heroBadge = (settings.hero_badge as string) || 'AI tools marketplace';
  const heroTitle = (settings.hero_title as string) || 'Find the exact AI tool you need, instantly';
  const heroSubtitle = (settings.hero_subtitle as string) || 'Search, compare and bookmark AI tools with Smart AI search, categories, and personalized collections.';
  const heroSearchPlaceholder = (settings.hero_search_placeholder as string) || 'Search AI tools by use case (e.g. create YouTube videos)';
  const heroSearchButtonText = (settings.hero_search_button_text as string) || 'Search';
  const heroTags = [
    (settings.hero_tag_1 as string),
    (settings.hero_tag_2 as string),
    (settings.hero_tag_3 as string),
  ]
    .map((tag) => (tag || '').trim())
    .filter(Boolean);
  const displayHeroTags = heroTags.length > 0 ? heroTags : ['YouTube tools', 'AI editors', 'Script generators'];

  useEffect(() => {
    async function loadHomepageData() {
      setToolsLoading(true);
      // Only show loading state after 300ms to avoid flashing on initial load
      const loadingTimer = setTimeout(() => setShowToolsLoading(true), 300);
      
      try {
        const [toolsData, categoriesData] = await Promise.all([
          fetchTools({ per_page: '50' }),
          fetchCategories(),
        ]);

        setTools(toolsData.data ?? toolsData);
        setCategories(categoriesData);
      } catch {
        setError('Unable to load homepage tools.');
      } finally {
        setToolsLoading(false);
        setShowToolsLoading(false);
        clearTimeout(loadingTimer);
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
          <p className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">{heroBadge}</p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{heroTitle}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{heroSubtitle}</p>

          <form onSubmit={handleSearch} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={heroSearchPlaceholder}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <button type="submit" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 whitespace-nowrap">{heroSearchButtonText}</button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-slate-600">
            {displayHeroTags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <section className="container pb-8">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        </section>
      )}

      {toolsLoading && showToolsLoading ? (
        <section className="container pb-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading tools...</div>
        </section>
      ) : (
        <>
          <ToolSection
            title="Just Landed"
            browseHref="/tools?filter=just_landed"
            browseLabel="Explore all"
            badge="Just Landed"
            tools={tools.filter((tool) => tool.just_landed).slice(0, 8)}
          />

          <ToolSection
            title="Trending tools"
            browseHref="/tools?filter=trending"
            browseLabel="See all"
            badge="Trending"
            tools={tools.filter((tool) => tool.trending).slice(0, 8)}
          />

          <ToolSection
            title="Featured tools"
            browseHref="/tools?filter=featured"
            browseLabel="Browse all"
            badge="Featured"
            tools={tools.filter((tool) => tool.featured).slice(0, 8)}
          />
        </>
      )}

      <section className="container pb-12">
        <h2 className="mb-5 text-2xl font-bold text-slate-900">Explore Top AI Categories</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.slice(0, 8).map((category) => (
            <Link
              key={category.slug}
              href={`/tools?category=${category.slug}`}
              className="card flex items-center gap-3 text-left font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                {category.icon ? (
                  <i className={category.icon} aria-hidden="true" />
                ) : (
                  <i className="bi bi-grid" aria-hidden="true" />
                )}
              </span>
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mb-16 rounded-3xl bg-indigo-600 p-10 text-white shadow-xl">
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
        <div className="container text-center text-sm text-slate-600">
          <p>{(settings.footer_text as string) || `© ${new Date().getFullYear()} ToolNavix. All rights reserved.`}</p>
        </div>
      </footer>
    </main>
  );
}
