'use client';

import { ReactNode } from 'react';

export interface Column<T> {
  key: keyof T;
  label: string;
  width?: string;
  render?: (value: any, item: T, index: number) => ReactNode;
  sortable?: boolean;
}

interface DashboardTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  rowActions?: (item: T) => ReactNode;
  className?: string;
}

export function DashboardTable<T extends { id?: number }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No records found',
  onRowClick,
  rowActions,
  className = '',
}: DashboardTableProps<T>) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <svg
          className="w-12 h-12 mx-auto mb-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-slate-200 ${className}`}>
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{ width: col.width }}
                className="px-6 py-3 text-left text-sm font-semibold text-slate-700"
              >
                {col.label}
                {col.sortable && (
                  <span className="ml-1 text-xs text-slate-400">⇅</span>
                )}
              </th>
            ))}
            {rowActions && (
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {data.map((item, idx) => (
            <tr
              key={item.id || idx}
              onClick={() => onRowClick?.(item)}
              className={`hover:bg-slate-50 transition ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((col) => {
                const value = item[col.key];
                return (
                  <td
                    key={String(col.key)}
                    className="px-6 py-4 text-sm text-slate-700"
                  >
                    {col.render ? col.render(value, item, idx) : String(value || '-')}
                  </td>
                );
              })}
              {rowActions && (
                <td className="px-6 py-4 text-sm">{rowActions(item)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
