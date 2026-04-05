import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchCategoryTools, fetchTool } from '../../lib/api';
import Header from '../../components/Header';
import TrackToolView from './TrackToolView';
import { sanitizeRichHtml } from '../../lib/richText';
import SaveToolButton from '../../components/SaveToolButton';

type ToolType = {
  id: number;
  name: string;
  slug: string;
  description: string;
  pricing: string;
  rating: number;
  logo?: string | null;
  category: { name: string; slug: string };
  features: string[];
  pros: string[];
  cons: string[];
  visit_url: string;
};

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      }
    } catch {
      // fallback to comma-separated text
    }

    return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

export default async function ToolDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let tool: ToolType;
  try {
    tool = await fetchTool(slug);
  } catch {
    notFound();
  }

  const features = normalizeList((tool as any).features);
  const pros = normalizeList((tool as any).pros);
  const cons = normalizeList((tool as any).cons);
  const descriptionHtml = sanitizeRichHtml(tool.description);

  let relatedTools: ToolType[] = [];
  try {
    const relatedResponse = await fetchCategoryTools(tool.category.slug, { per_page: '4' });
    const relatedData = Array.isArray(relatedResponse) ? relatedResponse : (relatedResponse.data ?? []);
    relatedTools = relatedData.filter((item: ToolType) => item.slug !== tool.slug).slice(0, 3);
  } catch {
    relatedTools = [];
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TrackToolView slug={slug} />
      <Header />
      <div className="container space-y-6 py-10">
        <Link href="/tools" className="text-indigo-600 hover:underline">&larr; Back to tools</Link>

        <section className="card">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{tool.name}</h1>
              <p className="mt-1 text-sm text-slate-600">{tool.category.name}</p>
              <div className="mt-3">
                <SaveToolButton toolId={tool.id} />
              </div>
            </div>

            <a href={tool.visit_url} target="_blank" rel="noreferrer" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
              Visit Site
              <i className="bi bi-box-arrow-up-right ms-1 small" aria-hidden="true" />
            </a>
          </div>

          <div
            className="mt-4 max-w-none break-words text-slate-700 [&_p]:mb-4 [&_p]:leading-7 [&_a]:break-all [&_a]:text-indigo-600 [&_a]:underline [&_code]:break-words [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-slate-100 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_*]:max-w-full"
            dangerouslySetInnerHTML={{ __html: descriptionHtml || '<p>No description available.</p>' }}
          />

          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-indigo-50 p-3">
              <dt className="text-xs font-medium text-slate-500">Price</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{tool.pricing}</dd>
            </div>
            <div className="rounded-lg bg-indigo-50 p-3">
              <dt className="text-xs font-medium text-slate-500">Rating</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{tool.rating} / 5</dd>
            </div>
          </dl>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="card">
            <h2 className="font-semibold text-slate-900">Features</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-slate-700">
              {features.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
          </article>

          <article className="card">
            <h2 className="font-semibold text-slate-900">Pros & Cons</h2>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-emerald-700">Pros</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
                  {pros.map((pro) => <li key={pro}>{pro}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-rose-700">Cons</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
                  {cons.map((con) => <li key={con}>{con}</li>)}
                </ul>
              </div>
            </div>
          </article>
        </section>

        <section className="card">
          <h2 className="font-semibold text-slate-900">Related tools</h2>
          <p className="mt-2 text-sm text-slate-600">Based on category and rating, more tools to explore.</p>

          {relatedTools.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {relatedTools.map((relatedTool) => (
                <article key={relatedTool.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="aspect-[16/9] bg-slate-100">
                    {relatedTool.logo ? (
                      <img src={relatedTool.logo} alt={relatedTool.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <Link href={`/tools/${relatedTool.slug}`} className="line-clamp-2 text-lg font-semibold text-slate-900 hover:text-indigo-600">
                      {relatedTool.name}
                    </Link>
                    <p className="mt-2 text-sm font-medium text-indigo-700">{relatedTool.pricing}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{relatedTool.rating} / 5</span>
                      <a
                        href={relatedTool.visit_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-indigo-600 hover:underline"
                      >
                        Visit site
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No related tools found in this category yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
