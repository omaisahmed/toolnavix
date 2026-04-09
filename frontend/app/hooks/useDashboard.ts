import { useState, useCallback, useEffect } from 'react';
import { dashboardCache } from '@/app/lib/dashboardCache';

interface UseDataFetchOptions {
  initialData?: any[];
  cacheKey?: string;
  sortKey?: string;
}

export function useDashboardData<T>(
  fetchFn: () => Promise<T>,
  options: UseDataFetchOptions = {}
) {
  const [data, setData] = useState<T>(options.initialData || ([] as any));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const result = await fetchFn();
      
      // Sort if sortKey provided
      if (options.sortKey && Array.isArray(result)) {
        const sorted = dashboardCache.sortData(result, options.sortKey);
        setData(sorted as any);
      } else {
        setData(result);
      }

      // Cache if cacheKey provided
      if (options.cacheKey) {
        const cache = dashboardCache.get();
        cache[options.cacheKey as keyof typeof cache] = result;
        dashboardCache.set(cache);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [fetchFn, options]);

  return {
    data,
    isLoading,
    error,
    fetchData,
    setData,
  };
}

// Hook for managing form state with error handling
export function useDashboardForm<T>(initialValues: T) {
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleChange = (field: keyof T, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[String(field)]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[String(field)];
        return newErrors;
      });
    }
  };

  const reset = () => {
    setForm(initialValues);
    setErrors({});
  };

  return {
    form,
    errors,
    handleChange,
    setErrors,
    setForm,
    reset,
  };
}
