import Link from 'next/link';
import Header from '../components/Header';
import { fetchPosts } from '../lib/api';
import type { Metadata } from 'next';
import { stripHtml } from '../lib/richText';

type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  image?: string | null;
  category?: string | null;
  published_at?: string | null;
};

type PaginatedPosts = {
  data: Post[];
  current_page: number;
  last_page: number;
};

function getPostPreview(post: Post): string {
  const fromExcerpt = stripHtml(post.excerpt || '');
  if (fromExcerpt) return fromExcerpt;

  const fromContent = stripHtml(post.content || '');
  return fromContent || 'Read full guide.';
}

export const metadata: Metadata = {
  title: 'Guides | ToolNavix',
  description: 'Step-by-step practical guides for AI workflows and tool usage.',
};

export default async function GuidesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Number(params?.page || '1') > 0 ? String(Number(params?.page || '1')) : '1';

  let payload: PaginatedPosts = { data: [], current_page: 1, last_page: 1 };
  try {
    payload = await fetchPosts({ type: 'guide', per_page: '9', page });
  } catch {
    payload = { data: [], current_page: 1, last_page: 1 };
  }

  const guides = payload.data ?? [];
  const currentPage = payload.current_page ?? 1;
  const lastPage = payload.last_page ?? 1;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 py-10">
        <div className="container space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Learning Hub</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Guides</h1>
            <p className="mt-2 text-sm text-slate-600">Follow hands-on walkthroughs to get better results from AI tools.</p>
          </section>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {guides.map((guide) => (
              <article key={guide.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="aspect-[16/9] bg-slate-100">
                  {guide.image ? <img src={guide.image} alt={guide.title} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">{guide.category || 'Guide'}</p>
                  <Link href={`/guides/${guide.slug}`} className="mt-2 block text-xl font-bold leading-tight text-slate-900 hover:text-indigo-600">{guide.title}</Link>
                  <p className="mt-2 text-xs text-slate-500">{guide.published_at ? new Date(guide.published_at).toLocaleDateString() : 'Draft'}</p>
                  <p className="mt-3 line-clamp-3 text-sm text-slate-600">{getPostPreview(guide)}</p>
                  <Link href={`/guides/${guide.slug}`} className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                    Read more
                  </Link>
                </div>
              </article>
            ))}
            {guides.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">No guides available yet.</div>}
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link
              href={`/guides?page=${Math.max(1, currentPage - 1)}`}
              className={`rounded-lg border px-3 py-2 text-sm ${currentPage <= 1 ? 'pointer-events-none border-slate-200 text-slate-400' : 'border-slate-300 text-slate-700 hover:bg-white'}`}
            >
              Previous
            </Link>
            <span className="text-sm text-slate-600">Page {currentPage} of {lastPage}</span>
            <Link
              href={`/guides?page=${Math.min(lastPage, currentPage + 1)}`}
              className={`rounded-lg border px-3 py-2 text-sm ${currentPage >= lastPage ? 'pointer-events-none border-slate-200 text-slate-400' : 'border-slate-300 text-slate-700 hover:bg-white'}`}
            >
              Next
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
