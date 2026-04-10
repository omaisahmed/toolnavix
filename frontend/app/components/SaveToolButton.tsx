'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { removeSavedTool, saveTool, fetchSavedTools } from '../lib/api';

type SaveToolButtonProps = {
  toolId: number;
  variant?: 'default' | 'overlay';
  initialSavedId?: number | null;
};

export default function SaveToolButton({ toolId, variant = 'default', initialSavedId = null }: SaveToolButtonProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(initialSavedId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem('toolnavix_token');
    setIsLoggedIn(Boolean(token));
    // If initialSavedId was provided as prop, no need to fetch
    // Otherwise, only fetch if needed (for pages that don't provide it)
    if (!token || initialSavedId !== undefined) return;

    fetchSavedTools(1)
      .then((res) => {
        const found = (res.data ?? []).find((item: any) => item.tool_id === toolId || item.tool?.id === toolId);
        setSavedId(found?.id ?? null);
      })
      .catch(() => null);
  }, [toolId, initialSavedId]);

  const toggleSave = async () => {
    if (!isLoggedIn) {
      toast((t) => (
        <div className="flex items-center justify-between gap-3">
          <span>Please login to add this tool.</span>
          <button
            onClick={() => {
              router.push('/login');
              toast.dismiss(t.id);
            }}
            className="whitespace-nowrap rounded bg-white px-3 py-1 text-sm font-semibold text-indigo-600 hover:bg-slate-100"
          >
            Login
          </button>
        </div>
      ), { icon: '🔐' });
      return;
    }

    setLoading(true);
    try {
      if (savedId) {
        await removeSavedTool(savedId);
        setSavedId(null);
        toast.success('Removed from My Tools');
      } else {
        const response = await saveTool(toolId);
        setSavedId(response.id ?? null);
        toast.success('Saved to My Tools');
      }
    } catch {
      toast.error('Unable to update saved tools');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'overlay') {
    return (
      <button
        type="button"
        onClick={toggleSave}
        disabled={loading}
        aria-label={savedId ? 'Remove from wishlist' : 'Add to wishlist'}
        title={savedId ? 'Saved to wishlist' : 'Add to wishlist'}
        className={`absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur transition ${
          savedId
            ? 'border-indigo-200 bg-white/95 text-indigo-600'
            : 'border-white/70 bg-white/90 text-slate-600 hover:text-indigo-600'
        } ${loading ? 'opacity-60' : ''}`}
      >
        <i className={`${savedId ? 'bi bi-heart-fill' : 'bi bi-heart'} text-base`} aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleSave}
      disabled={loading}
      className={`rounded-lg border px-3 py-1 text-xs font-medium ${savedId ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
    >
      {savedId ? 'Saved' : 'Save Tool'}
    </button>
  );
}
