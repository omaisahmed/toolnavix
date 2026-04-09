'use client';

interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

interface DashboardPaginationProps {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function DashboardPagination({
  meta,
  onPageChange,
  isLoading,
}: DashboardPaginationProps) {
  if (!meta || meta.last_page <= 1) return null;

  const pages: (number | string)[] = [];
  const startPage = Math.max(1, meta.current_page - 2);
  const endPage = Math.min(meta.last_page, meta.current_page + 2);

  if (startPage > 1) pages.push(1);
  if (startPage > 2) pages.push('...');

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < meta.last_page - 1) pages.push('...');
  if (endPage < meta.last_page) pages.push(meta.last_page);

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(meta.current_page - 1)}
        disabled={meta.current_page === 1 || isLoading}
        className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Previous
      </button>

      {pages.map((page, idx) =>
        typeof page === 'number' ? (
          <button
            key={idx}
            onClick={() => onPageChange(page)}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg border transition ${
              page === meta.current_page
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-300 hover:bg-slate-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {page}
          </button>
        ) : (
          <span key={idx} className="px-2 text-slate-500">
            {page}
          </span>
        )
      )}

      <button
        onClick={() => onPageChange(meta.current_page + 1)}
        disabled={meta.current_page === meta.last_page || isLoading}
        className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Next
      </button>

      <div className="ml-4 text-sm text-slate-600">
        Page {meta.current_page} of {meta.last_page} • {meta.total} total
      </div>
    </div>
  );
}
