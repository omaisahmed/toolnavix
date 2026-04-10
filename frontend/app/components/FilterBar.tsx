'use client';

import { useState } from 'react';

export type FilterConfig = {
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'select' | 'checkbox';
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
  }>;
};

type FilterBarProps = {
  filters: Record<string, string | boolean>;
  onFilterChange: (filters: Record<string, string | boolean>) => void;
  config: FilterConfig;
  onAddNew?: () => void;
  addNewLabel?: string;
};

export default function FilterBar({ filters, onFilterChange, config, onAddNew, addNewLabel = 'Add New' }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (key: string, value: string | boolean) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    const resetFilters: Record<string, string | boolean> = {};
    config.fields.forEach((field) => {
      resetFilters[field.key] = field.type === 'checkbox' ? false : '';
    });
    onFilterChange(resetFilters);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '' && v !== false);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            <i className={`bi bi-funnel transition ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
            Filters
          </button>
        </div>
        <div className="flex items-center gap-2">
          {onAddNew && (
            <button type="button" onClick={onAddNew} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">
              <i className="bi bi-plus-lg" aria-hidden="true" />
              {addNewLabel}
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="grid gap-3 border-t border-slate-200 pt-3 md:grid-cols-2 lg:grid-cols-4">
          {config.fields.map((field) => (
            <div key={field.key}>
              <label className="text-xs font-medium text-slate-600">{field.label}</label>
              {field.type === 'text' && (
                <input
                  type="text"
                  value={filters[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              )}
              {field.type === 'select' && (
                <select
                  value={filters[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">All</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              {field.type === 'checkbox' && (
                <label className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters[field.key] as boolean}
                    onChange={(e) => handleChange(field.key, e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-600">{field.label}</span>
                </label>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 mt-auto">
          <button
            type="button"
            onClick={handleReset}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              hasActiveFilters
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            disabled={!hasActiveFilters}
          >
            <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
            Reset
          </button>
          </div>
        </div>
      )}
    </div>
  );
}
