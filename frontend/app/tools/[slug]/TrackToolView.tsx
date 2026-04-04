'use client';

import { useEffect } from 'react';
import { trackToolView } from '../../lib/api';

export default function TrackToolView({ slug }: { slug: string }) {
  useEffect(() => {
    trackToolView(slug).catch(() => {
      // Best-effort tracking; ignore client-side failures.
    });
  }, [slug]);

  return null;
}
