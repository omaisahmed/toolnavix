import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import { fetchPost } from '../../lib/api';
import { sanitizeRichHtml } from '../../lib/richText';

type Post = {
  title: string;
  content: string;
  image?: string | null;
  category?: string | null;
  published_at?: string | null;
};

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let post: (Post & { type?: string }) | null = null;
  try {
    post = await fetchPost(slug);
  } catch {
    post = null;
  }

  if (!post || post.type !== 'guide') {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 py-10">
        <article className="container rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">{post.title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {post.category || 'Guide'}
            {post.published_at ? ` - ${new Date(post.published_at).toLocaleDateString()}` : ''}
          </p>
          {post.image && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
            </div>
          )}
          <div
            className="prose prose-slate mt-6 max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.content) }}
          />
        </article>
      </main>
    </>
  );
}
