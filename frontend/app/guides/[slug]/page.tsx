import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import ShareButtons from '../../components/ShareButtons';
import { fetchPost } from '../../lib/api';
import { sanitizeRichHtml } from '../../lib/richText';

type Post = {
  title: string;
  content: string;
  image?: string | null;
  category?: string | null;
  published_at?: string | null;
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
}

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
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {post.category || 'Guide'}
              {post.published_at ? ` - ${formatDate(post.published_at)}` : ''}
            </p>
            <ShareButtons title={post.title} slug={slug} />
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {post.image ? (
              <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
            ) : (
              <div className="aspect-video w-full animate-pulse bg-gradient-to-br from-slate-200 to-slate-300" />
            )}
          </div>
          <div
            className="prose prose-slate mt-6 max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.content) }}
          />
        </article>
      </main>
    </>
  );
}
