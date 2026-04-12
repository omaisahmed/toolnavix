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

  const ratingValue = Number(tool.rating || 0);
  const ratingLabel = ratingValue >= 4.5 ? 'Excellent' : ratingValue >= 4 ? 'Very Good' : ratingValue >= 3 ? 'Good' : 'Needs review';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <TrackToolView slug={slug} />
      <Header />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_52%),radial-gradient(circle_at_top_left,_rgba(99,102,241,0.15),_transparent_48%)]" />

      <div className="container relative space-y-6 py-10">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur transition hover:border-indigo-300 hover:text-indigo-700"
        >
          <i className="bi bi-arrow-left" aria-hidden="true" />
          Back to tools
        </Link>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/60 backdrop-blur md:p-8">
          <div className="grid gap-7 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                <i className="bi bi-stars" aria-hidden="true" />
                AI Tool Profile
              </span>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">{tool.category.name}</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">{tool.name}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  A quick, focused overview to decide if this tool deserves a spot in your workflow.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Category</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{tool.category.name}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Pricing</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{tool.pricing}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Rating</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{tool.rating} / 5</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={tool.visit_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Open tool
                  <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
                </a>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <SaveToolButton toolId={tool.id} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <div className="aspect-[16/11]">
                  {tool.logo ? (
                    <img src={tool.logo} alt={tool.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,_#cbd5e1_0%,_#e2e8f0_55%,_#f8fafc_100%)]">
                      <span className="rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">No logo uploaded</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-600">Score</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{ratingLabel}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-600">Availability</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Live now</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <i className="bi bi-lightning-charge" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">Overview</h2>
            </div>

            <div
              className="max-w-none break-words text-slate-700 [&_p]:mb-4 [&_p]:leading-7 [&_a]:break-all [&_a]:text-indigo-600 [&_a]:underline [&_code]:break-words [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-slate-100 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_*]:max-w-full"
              dangerouslySetInnerHTML={{ __html: descriptionHtml || '<p>No description available.</p>' }}
            />
          </article>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Quick Actions</h2>
              <a
                href={tool.visit_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Launch {tool.name}
                <i className="bi bi-arrow-up-right" aria-hidden="true" />
              </a>
              <div className="mt-3 rounded-xl border border-slate-200 p-3">
                <SaveToolButton toolId={tool.id} />
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Why People Pick It</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <i className="bi bi-check2-circle mt-0.5 text-emerald-600" aria-hidden="true" />
                  Category fit: <strong>{tool.category.name}</strong>
                </li>
                <li className="flex items-start gap-2">
                  <i className="bi bi-check2-circle mt-0.5 text-emerald-600" aria-hidden="true" />
                  User rating: <strong>{tool.rating} / 5</strong>
                </li>
                <li className="flex items-start gap-2">
                  <i className="bi bi-check2-circle mt-0.5 text-emerald-600" aria-hidden="true" />
                  Pricing model: <strong>{tool.pricing}</strong>
                </li>
              </ul>
            </article>
          </aside>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <i className="bi bi-grid-3x3-gap" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">Features</h2>
            </div>
            {features.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-700">
                {features.map((feature, index) => (
                  <li key={`${feature}-${index}`} className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <i className="bi bi-check2-circle mt-0.5 text-indigo-600" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No feature details were added yet.
              </p>
            )}
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <i className="bi bi-balance-scale" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">Pros & Cons</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-emerald-700">Pros</h3>
                {pros.length > 0 ? (
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {pros.map((pro, index) => (
                      <li key={`${pro}-${index}`} className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                        <i className="bi bi-plus-circle mt-0.5 text-emerald-600" aria-hidden="true" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    No pros listed yet.
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-rose-700">Cons</h3>
                {cons.length > 0 ? (
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {cons.map((con, index) => (
                      <li key={`${con}-${index}`} className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                        <i className="bi bi-dash-circle mt-0.5 text-rose-600" aria-hidden="true" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    No cons listed yet.
                  </p>
                )}
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Related tools</h2>
          <p className="mt-1 text-sm text-slate-600">Explore more options in {tool.category.name}.</p>

          {relatedTools.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {relatedTools.map((relatedTool) => (
                <article key={relatedTool.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <Link href={`/tools/${relatedTool.slug}`} className="block aspect-[16/9] bg-slate-100" aria-label={`Open ${relatedTool.name}`}>
                    {relatedTool.logo ? (
                      <img src={relatedTool.logo} alt={relatedTool.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full animate-pulse bg-gradient-to-br from-slate-200 to-slate-300" />
                    )}
                  </Link>
                  <div className="p-4">
                    <Link href={`/tools/${relatedTool.slug}`} className="line-clamp-2 text-lg font-semibold text-slate-900 hover:text-indigo-600">
                      {relatedTool.name}
                    </Link>
                    <p className="mt-2 inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{relatedTool.pricing}</p>
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
