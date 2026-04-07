'use client';

import { useEffect, useState } from 'react';
import { fetchTools } from '../lib/api';
import Header from '../components/Header';
import SaveToolButton from '../components/SaveToolButton';

type Tool = {
  id: number;
  name: string;
  slug: string;
  pricing: string;
  rating: number;
  featured?: boolean;
  trending?: boolean;
  just_landed?: boolean;
  visit_url?: string;
  logo?: string | null;
  category?: { name?: string };
};

export default function ComparePage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(['', '', '']);
  const [searchTerms, setSearchTerms] = useState<string[]>(['', '', '']);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTools()
      .then((toolsData) => setTools(toolsData.data ?? toolsData))
      .catch(() => setError('Failed to fetch tools'));
  }, []);

  useEffect(() => {
    if (!tools.length) return;

    setSelectedIds((prev) => {
      if (prev.some(Boolean)) return prev;
      const next = [
        String(tools[0]?.id ?? ''),
        String(tools[1]?.id ?? ''),
        String(tools[2]?.id ?? ''),
      ];
      setSearchTerms([
        tools[0]?.name || '',
        tools[1]?.name || '',
        tools[2]?.name || '',
      ]);
      return next;
    });
  }, [tools]);

  const selectedTools = selectedIds
    .map((id) => tools.find((tool) => String(tool.id) === id))
    .filter((tool): tool is Tool => Boolean(tool));
  const selected = selectedTools;

  const updateSlot = (index: number, nextId: string) => {
    setSelectedIds((prev) => {
      const copy = [...prev];
      copy[index] = nextId;
      return copy;
    });
    const selectedTool = tools.find((tool) => String(tool.id) === nextId);
    setSearchTerms((prev) => {
      const copy = [...prev];
      copy[index] = selectedTool?.name || '';
      return copy;
    });
  };

  const handleSearchTermChange = (index: number, value: string) => {
    setSearchTerms((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });

    if (!value.trim()) {
      updateSlot(index, '');
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white py-10">
      <div className="container space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Tool Comparison</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Compare AI Tools Side by Side</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Pick up to 3 tools and compare pricing, ratings, and positioning in one glance.
          </p>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map((slot) => (
              <div key={slot}>
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Tool Slot {slot + 1}
                </label>
                <div className="relative mt-2">
                  <input
                    value={searchTerms[slot] || ''}
                    onChange={(event) => handleSearchTermChange(slot, event.target.value)}
                    onFocus={() => setActiveSlot(slot)}
                    onBlur={() => setTimeout(() => setActiveSlot((prev) => (prev === slot ? null : prev)), 120)}
                    placeholder="Search tool by name..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  {activeSlot === slot && (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {tools
                        .filter((tool) => tool.name.toLowerCase().includes((searchTerms[slot] || '').toLowerCase()))
                        .slice(0, 10)
                        .map((tool) => (
                          <button
                            key={`slot-${slot}-tool-${tool.id}`}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              updateSlot(slot, String(tool.id));
                              setActiveSlot(null);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {tool.name}
                          </button>
                        ))}
                      {!tools.some((tool) => tool.name.toLowerCase().includes((searchTerms[slot] || '').toLowerCase())) && (
                        <p className="px-3 py-2 text-xs text-slate-500">No matching tools</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

          <section className="grid gap-4 md:grid-cols-3">
            {selected.map((tool, index) => (
              <article key={`${tool.id}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[16/9] bg-slate-100">
                <SaveToolButton toolId={tool.id} variant="overlay" />
                {tool.logo ? (
                  <img src={tool.logo} alt={tool.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full animate-pulse bg-gradient-to-br from-slate-200 to-slate-300" />
                )}
              </div>
              <div className="p-4">
                <h2 className="line-clamp-2 text-xl font-bold text-slate-900">{tool.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{tool.category?.name || 'Uncategorized'}</p>
                <p className="mt-3 text-sm font-semibold text-indigo-700">{tool.pricing || '-'}</p>
              </div>
            </article>
          ))}
        </section>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4">
          <table className="min-w-full table-auto text-left text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2">Feature</th>
                  {selected.map((tool, index) => (
                    <th key={`head-${tool.id}-${index}`} className="px-3 py-2 font-semibold text-slate-700">{tool.name}</th>
                  ))}
              </tr>
            </thead>
            <tbody className="hidden">
              {['Pricing', 'Rating', 'Best use case'].map((feature) => (
                <tr key={feature} className="border-t border-slate-200">
                  <td className="px-3 py-2 font-medium text-slate-600">{feature}</td>
                  {selected.map((tool, index) => (
                    <td key={`${feature}-${tool.id}-${index}`} className="px-3 py-2 text-slate-700">
                      {feature === 'Pricing' && tool.pricing}
                      {feature === 'Rating' && `${tool.rating} ★`}
                      {feature === 'Best use case' && tool.category?.name}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tbody>
              <tr className="border-t border-slate-200">
                <td className="px-3 py-2 font-medium text-slate-600">Pricing</td>
                {selected.map((tool, index) => (
                  <td key={`pricing-${tool.id}-${index}`} className="px-3 py-2 text-slate-700">{tool.pricing || '-'}</td>
                ))}
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-3 py-2 font-medium text-slate-600">Rating</td>
                {selected.map((tool, index) => (
                  <td key={`rating-${tool.id}-${index}`} className="px-3 py-2 text-slate-700">
                    {typeof tool.rating === 'number' ? `${tool.rating} / 5` : '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-3 py-2 font-medium text-slate-600">Category</td>
                {selected.map((tool, index) => (
                  <td key={`category-${tool.id}-${index}`} className="px-3 py-2 text-slate-700">{tool.category?.name || '-'}</td>
                ))}
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-3 py-2 font-medium text-slate-600">Featured</td>
                {selected.map((tool, index) => (
                  <td key={`featured-${tool.id}-${index}`} className="px-3 py-2 text-slate-700">{tool.featured ? 'Yes' : 'No'}</td>
                ))}
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-3 py-2 font-medium text-slate-600">Trending</td>
                {selected.map((tool, index) => (
                  <td key={`trending-${tool.id}-${index}`} className="px-3 py-2 text-slate-700">{tool.trending ? 'Yes' : 'No'}</td>
                ))}
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-3 py-2 font-medium text-slate-600">Just Landed</td>
                {selected.map((tool, index) => (
                  <td key={`just-landed-${tool.id}-${index}`} className="px-3 py-2 text-slate-700">{tool.just_landed ? 'Yes' : 'No'}</td>
                ))}
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-3 py-2 font-medium text-slate-600">Visit</td>
                {selected.map((tool, index) => (
                  <td key={`visit-${tool.id}-${index}`} className="px-3 py-2 text-slate-700">
                    {tool.visit_url ? (
                      <a href={tool.visit_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                        Open site
                      </a>
                    ) : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
    </>
  );
}
