const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`;

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('toolnavix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authFetch(url: string, options: RequestInit = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json', ...getAuthHeaders() });

  if (options.headers) {
    const extraHeaders = new Headers(options.headers as HeadersInit);
    extraHeaders.forEach((value, key) => headers.set(key, value));
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Request failed');
  }
  return response.json();
}

export async function fetchTools(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}/tools?${query}`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error('Failed to fetch tools');
  return response.json();
}

export async function fetchTool(slug: string) {
  const response = await fetch(`${API_BASE}/tools/${slug}`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error('Tool not found');
  return response.json();
}

export async function fetchCategories() {
  const response = await fetch(`${API_BASE}/categories`, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}

export async function aiSearch(query: string) {
  const response = await fetch(`${API_BASE}/ai-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error('AI search failed');
  return response.json();
}

export async function fetchDashboardStats() {
  return authFetch(`${API_BASE}/dashboard/stats`, { method: 'GET' });
}

export async function fetchDashboardUsers(page = 1) {
  return authFetch(`${API_BASE}/dashboard/users?page=${page}`);
}

export async function banUser(userId: number) {
  return authFetch(`${API_BASE}/dashboard/users/${userId}/ban`, { method: 'POST' });
}

export async function updateUser(userId: number, payload: Record<string, unknown>) {
  return authFetch(`${API_BASE}/dashboard/users/${userId}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function createUser(payload: Record<string, unknown>) {
  return authFetch(`${API_BASE}/dashboard/users`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchSettings() {
  return authFetch(`${API_BASE}/dashboard/settings`);
}

export async function updateSettings(formData: FormData) {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('toolnavix_token');
  const headers = new Headers({ Authorization: `Bearer ${token}` });

  if (!formData.has('_method')) {
    formData.append('_method', 'PUT');
  }

  const response = await fetch(`${API_BASE}/dashboard/settings`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || 'Request failed');
  }
  return response.json();
}

export async function fetchDashboardReviews(page = 1) {
  return authFetch(`${API_BASE}/dashboard/reviews?page=${page}`);
}

export async function approveReview(reviewId: number) {
  return authFetch(`${API_BASE}/dashboard/reviews/${reviewId}/approve`, { method: 'POST' });
}

export async function deleteReview(reviewId: number) {
  return authFetch(`${API_BASE}/dashboard/reviews/${reviewId}`, { method: 'DELETE' });
}

export async function createTool(payload: Record<string, unknown>) {
  return authFetch(`${API_BASE}/tools`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateTool(toolId: number, payload: Record<string, unknown>) {
  return authFetch(`${API_BASE}/tools/${toolId}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteTool(toolId: number) {
  return authFetch(`${API_BASE}/tools/${toolId}`, { method: 'DELETE' });
}

export async function createCategory(payload: Record<string, unknown>) {
  return authFetch(`${API_BASE}/categories`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateCategory(categoryId: number, payload: Record<string, unknown>) {
  return authFetch(`${API_BASE}/categories/${categoryId}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteCategory(categoryId: number) {
  return authFetch(`${API_BASE}/categories/${categoryId}`, { method: 'DELETE' });
}
