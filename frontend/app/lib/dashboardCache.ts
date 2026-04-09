// Utility for managing dashboard cache
export type CacheData = {
  tools: any[];
  categories: any[];
  posts: any[];
  users: any[];
  reviews: any[];
  settings: any;
};

export const dashboardCache = {
  get: (): Partial<CacheData> => {
    if (typeof window === 'undefined') return {};
    try {
      const cached = sessionStorage.getItem('dashboardCache');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  },

  set: (data: Partial<CacheData>) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('dashboardCache', JSON.stringify(data));
    } catch {
      // Silently fail
    }
  },

  clear: () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('dashboardCache');
  },

  getRefreshItem: () => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem('dashboardRefreshItem');
      if (stored) {
        const item = JSON.parse(stored);
        // Only return if less than 30 seconds old
        if (Date.now() - item.timestamp < 30000) {
          return item;
        }
      }
    } catch {
      // Silently ignore
    }
    return null;
  },

  setRefreshItem: (type: string, data: any) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('dashboardRefreshItem', JSON.stringify({
        type,
        data,
        timestamp: Date.now(),
      }));
    } catch {
      // Silently fail
    }
  },

  clearRefreshItem: () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('dashboardRefreshItem');
  },

  sortData: (data: any[], key: string = 'created_at') => {
    return [...data].sort((a, b) => {
      const aDate = new Date((a[key] || a.created_at || 0) as string).getTime();
      const bDate = new Date((b[key] || b.created_at || 0) as string).getTime();
      return bDate - aDate;
    });
  },
};
