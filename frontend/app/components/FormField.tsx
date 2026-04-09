'use client';

import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  value: string | number | boolean;
  onChange: (value: any) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  options?: Array<{ value: string | number; label: string }>;
  disabled?: boolean;
  rows?: number;
  className?: string;
  children?: ReactNode;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  error,
  options,
  disabled,
  rows,
  className = '',
  children,
}: FormFieldProps) {
  const baseInputClass = 'w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition disabled:bg-slate-100 disabled:cursor-not-allowed';

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          name={name}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows || 4}
          className={baseInputClass}
        />
      ) : type === 'select' ? (
        <select
          name={name}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={baseInputClass}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'password' ? (
        <input
          type="password"
          name={name}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={baseInputClass}
        />
      ) : (
        <>
          {children ? (
            <div className={baseInputClass}>{children}</div>
          ) : (
            <input
              type={type}
              name={name}
              value={type === 'number' ? (typeof value === 'number' ? value : Number(value) || 0) : String(value)}
              onChange={(e) =>
                onChange(type === 'number' ? e.target.valueAsNumber : e.target.value)
              }
              placeholder={placeholder}
              disabled={disabled}
              className={baseInputClass}
            />
          )}
        </>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
