import type { Metadata } from 'next';

import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import { fetchPost } from '../../lib/api';
import { sanitizeRichHtml } from '../../lib/richText';

type Post = {
  id: number;
  title: string;
  excerpt?: string | null;
  image?: string | null;
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
  tags?: string[];
  category?: string | null;
  published_at?: string | null;
};

async function getPost(slug: string): Promise<Post | null> {
  try {
    const post = await fetchPost(slug);
    return post?.type === 'blog' ? (post as Post) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Blog Post Not Found | ToolNavix',
      description: 'The requested blog post was not found.',
    };
  }

  return {
    title: post.meta_title || `${post.title} | ToolNavix Blog`,
    description: post.meta_description || post.excerpt || undefined,
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 py-10">
        <article className="container rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          
          <h1 className="text-3xl font-bold text-slate-900">{post.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{post.category || 'General'} {post.published_at ? `- ${new Date(post.published_at).toLocaleDateString()}` : ''}</p>
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
