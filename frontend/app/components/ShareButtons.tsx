'use client';

import { useEffect, useState } from 'react';

type ShareButtonsProps = {
  title: string;
  slug: string;
};

export default function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    // Construct the full URL on the client side
    const currentUrl = window.location.href;
    setUrl(currentUrl);
  }, [slug]);

  if (!url) return null;

  return (
    <div className="flex gap-3">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-500 hover:text-indigo-600"
        aria-label="Share on Facebook"
      >
        <i className="bi bi-facebook text-lg" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-500 hover:text-indigo-600"
        aria-label="Share on Twitter"
      >
        <i className="bi bi-twitter text-lg" />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-500 hover:text-indigo-600"
        aria-label="Share on LinkedIn"
      >
        <i className="bi bi-linkedin text-lg" />
      </a>
    </div>
  );
}
