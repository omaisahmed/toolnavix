'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { removeSavedTool, saveTool, fetchSavedTools } from '../lib/api';

type SaveToolButtonProps = {
  toolId: number;
};

export default function SaveToolButton({ toolId }: SaveToolButtonProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem('toolnavix_token');
    setIsLoggedIn(Boolean(token));
    if (!token) return;

    fetchSavedTools(1)
      .then((res) => {
        const found = (res.data ?? []).find((item: any) => item.tool_id === toolId || item.tool?.id === toolId);
        setSavedId(found?.id ?? null);
      })
      .catch(() => null);
  }, [toolId]);

  if (!isLoggedIn) return null;

  const toggleSave = async () => {
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

