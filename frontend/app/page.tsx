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

function ToolCard({ tool, badge, savedId }: { tool: HomepageTool; badge: string; savedId?: number | null }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        <SaveToolButton toolId={tool.id} variant="overlay" initialSavedId={savedId ?? null} />
        <span className="absolute left-3 top-3 z-10 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
          {badge}
        </span>
        <Link href={`/tools/${tool.slug}`} className="block h-full w-full" aria-label={`Open ${tool.name}`}>
          {tool.logo ? (
            <img src={tool.logo} alt={tool.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
          ) : (
            <div className="h-full w-full animate-pulse bg-gradient-to-br from-slate-200 to-slate-300" />
          )}
        </Link>
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
            <p className="text-xs text-slate-500">{tool.rating.toFixed(1)} / 5</p>
            <p className="text-sm font-semibold text-indigo-700">{tool.pricing}</p>
          </div>
        </div>
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
  savedToolIds,
}: {
  title: string;
  browseHref: string;
  browseLabel: string;
  badge: string;
  tools: HomepageTool[];
  savedToolIds: Map<number, number>;
}) {
  return (
    <section className="container pb-12">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">{title}</h2>
        <Link href={browseHref} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          {browseLabel}
          <i className="bi bi-arrow-right" aria-hidden="true" />
        </Link>
      </div>

      {tools.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} badge={badge} savedId={savedToolIds.get(tool.id)} />
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
  const [savedToolIds, setSavedToolIds] = useState<Map<number, number>>(new Map());
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
  const categorySlugToId = new Map(categories.map((category) => [category.slug, category.id]));
  const categoryToolCounts = new Map<number, number>();

  tools.forEach((tool) => {
    const categorySlug = tool.category?.slug;
    if (!categorySlug) return;
    const categoryId = categorySlugToId.get(categorySlug);
    if (!categoryId) return;
    categoryToolCounts.set(categoryId, (categoryToolCounts.get(categoryId) ?? 0) + 1);
  });

  const topCategories = categories
    .filter((category) => (categoryToolCounts.get(category.id) ?? 0) > 0)
    .sort((a, b) => (categoryToolCounts.get(b.id) ?? 0) - (categoryToolCounts.get(a.id) ?? 0))
    .slice(0, 8);
  const quickSearches = [
    'ai video editor',
    'ai code assistant',
    'ai image generator',
    'ai meeting notes',
    'ai resume builder',
    'ai voice cloning',
  ];
  const featuredCount = tools.filter((tool) => tool.featured).length;
  const trendingCount = tools.filter((tool) => tool.trending).length;
  const justLandedCount = tools.filter((tool) => tool.just_landed).length;

  useEffect(() => {
    async function loadHomepageData() {
      setToolsLoading(true);
      // Only show loading state after 300ms to avoid flashing on initial load
      const loadingTimer = setTimeout(() => setShowToolsLoading(true), 300);
      
      try {
        const token = window.localStorage.getItem('toolnavix_token');
        const [toolsData, categoriesData, savedData] = await Promise.all([
          fetchTools({ per_page: '50' }),
          fetchCategories(),
          token ? (await import('./lib/api')).fetchSavedTools(1).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ]);

        setTools(toolsData.data ?? toolsData);
        setCategories(categoriesData);
        
        // Build a map of tool IDs to saved IDs for quick lookup
        const savedMap = new Map<number, number>();
        (savedData.data ?? []).forEach((item: any) => {
          const toolId = item.tool_id || item.tool?.id;
          if (toolId) savedMap.set(toolId, item.id);
        });
        setSavedToolIds(savedMap);
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_32%),linear-gradient(to_bottom,_#f8fafc,_#ffffff_40%,_#f1f5f9)]">
      <Header />

      <section className="container pb-12 pt-16">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-xl shadow-slate-200/60 backdrop-blur sm:p-9">
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
              <i className="bi bi-cpu" aria-hidden="true" />
              {heroBadge}
            </p>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{heroTitle}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{heroSubtitle}</p>

            <form onSubmit={handleSearch} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="relative w-full">
                <i className="bi bi-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={heroSearchPlaceholder}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-11 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 whitespace-nowrap">
                {heroSearchButtonText}
                <i className="bi bi-arrow-up-right" aria-hidden="true" />
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              {quickSearches.map((query) => (
                <Link key={query} href={`/tools?search=${encodeURIComponent(query)}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700">
                  {query}
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
              {displayHeroTags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-3 py-1">{tag}</span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Directory Snapshot</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Tools</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{tools.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Categories</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{categories.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Trending</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{trendingCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Just landed</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{justLandedCount}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Search Modes</p>
              <div className="mt-4 space-y-2">
                <Link href="/top-ai-tools" className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700">
                  <span>Top AI Tools</span>
                  <span className="text-xs text-slate-500">{trendingCount} tools</span>
                </Link>
                <Link href="/all-ai-tools?pricing=free" className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700">
                  <span>Free Stack Finder</span>
                  <span className="text-xs text-slate-500">Cost-friendly</span>
                </Link>
                <Link href="/featured-ai-tools" className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700">
                  <span>Featured Signals</span>
                  <span className="text-xs text-slate-500">{featuredCount} curated</span>
                </Link>
              </div>
            </div>
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
            savedToolIds={savedToolIds}
          />

          <ToolSection
            title="Trending tools"
            browseHref="/tools?filter=trending"
            browseLabel="See all"
            badge="Trending"
            tools={tools.filter((tool) => tool.trending).slice(0, 8)}
            savedToolIds={savedToolIds}
          />

          <ToolSection
            title="Featured tools"
            browseHref="/tools?filter=featured"
            browseLabel="Browse all"
            badge="Featured"
            tools={tools.filter((tool) => tool.featured).slice(0, 8)}
            savedToolIds={savedToolIds}
          />
        </>
      )}

      <section className="container pb-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Explore Top AI Categories</h2>
            <Link href="/categories" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View all categories</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/all-ai-tools?category=${category.slug}`}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  {category.icon ? (
                    <i className={category.icon} aria-hidden="true" />
                  ) : (
                    <i className="bi bi-grid" aria-hidden="true" />
                  )}
                </span>
                <div>
                  <span className="block">{category.name}</span>
                  <span className="text-xs font-medium text-slate-500">{categoryToolCounts.get(category.id) ?? 0} tools</span>
                </div>
              </div>
              <i className="bi bi-arrow-right text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="container mb-16 rounded-3xl bg-[linear-gradient(120deg,_#4f46e5,_#2563eb,_#0f766e)] p-10 text-white shadow-xl">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-100">AI Search Directory Engine</p>
            <h2 className="mt-2 text-3xl font-black">Build your AI stack faster with smarter discovery</h2>
            <p className="mt-3 text-slate-100">Sign up to save tools, build collections and discover trends in minutes.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/register" className="rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50">Create account</Link>
            <Link href="/login" className="rounded-xl border border-white/80 px-6 py-3 text-white transition hover:bg-white/10">Log in</Link>
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
