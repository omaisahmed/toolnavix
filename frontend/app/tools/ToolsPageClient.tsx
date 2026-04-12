'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ToolsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    router.replace(`/all-ai-tools?${params.toString()}`);
  }, [router, searchParams]);

  return null;
}
