import Link from 'next/link';
import { fetchTool } from '../../lib/api';

type ToolType = {
  id: number;
  name: string;
  slug: string;
  description: string;
  pricing: string;
  rating: number;
  category: { name: string; slug: string };
  features: string[];
  pros: string[];
  cons: string[];
  visit_url: string;
};

export default async function ToolDetail({ params }: { params: { slug: string } }) {
  const tool: ToolType = await fetchTool(params.slug);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container space-y-6">
        <Link href="/tools" className="text-indigo-600 hover:underline">← Back to tools</Link>
        <section className="card">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{tool.name}</h1>
              <p className="mt-1 text-sm text-slate-600">{tool.category.name}</p>
            </div>
            <a href={tool.visit_url} target="_blank" rel="noreferrer" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Visit Site</a>
          </div>
          <p className="mt-4 text-slate-700">{tool.description}</p>
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
            <ul className="mt-3 space-y-2 list-disc list-inside text-slate-700">
              {(tool.features || []).map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
          </article>

          <article className="card">
            <h2 className="font-semibold text-slate-900">Pros & Cons</h2>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-emerald-700">Pros</h3>
                <ul className="mt-2 space-y-1 list-disc list-inside text-slate-700">
                  {(tool.pros || []).map((pro) => <li key={pro}>{pro}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-rose-700">Cons</h3>
                <ul className="mt-2 space-y-1 list-disc list-inside text-slate-700">
                  {(tool.cons || []).map((con) => <li key={con}>{con}</li>)}
                </ul>
              </div>
            </div>
          </article>
        </section>

        <section className="card">
          <h2 className="font-semibold text-slate-900">Related tools</h2>
          <p className="mt-2 text-sm text-slate-600">Based on category and rating, more tools to explore.</p>
          {/* placeholder - real related tools should come from API endpoint */}
        </section>
      </div>
    </div>
  );
}
