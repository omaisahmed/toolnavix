const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`;

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('toolnavix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authFetch(url: string, options: RequestInit = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = new Headers({ ...getAuthHeaders() });

  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.headers) {
    const extraHeaders = new Headers(options.headers as HeadersInit);
    extraHeaders.forEach((value, key) => headers.set(key, value));
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || 'Request failed') as any;
    error.response = { data: body };
    throw error;
  }
  return response.json();
}

export async function fetchTools(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  // Disable cache for specific queries (like when fetching for edit forms)
  const hasParams = Object.keys(params).length > 0;
  const response = await fetch(`${API_BASE}/tools?${query}`, { 
    next: hasParams ? { revalidate: 0 } : { revalidate: 60 }
  });
  if (!response.ok) throw new Error('Failed to fetch tools');
  return response.json();
}

export async function fetchFeaturedTools(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}/tools/featured?${query}`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error('Failed to fetch featured tools');
  return response.json();
}

export async function fetchTopTools(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}/tools/top?${query}`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error('Failed to fetch top tools');
  return response.json();
}

export async function fetchFreeTools(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}/tools/free?${query}`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error('Failed to fetch free tools');
  return response.json();
}

export async function fetchNewTools(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}/tools/new?${query}`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error('Failed to fetch new tools');
  return response.json();
}

export async function fetchTool(slug: string) {
  const response = await fetch(`${API_BASE}/tools/${slug}`, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error('Tool not found');
  return response.json();
}

export async function trackToolView(slug: string) {
  const response = await fetch(`${API_BASE}/tools/${slug}/view`, {
    method: 'POST',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Failed to track tool view');
  return response.json();
}

export async function fetchCategories() {
  const response = await fetch(`${API_BASE}/categories`, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}

export async function fetchCategoryTools(slug: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}/categories/${slug}/tools?${query}`, { next: { revalidate: 120 } });
  if (!response.ok) throw new Error('Failed to fetch category tools');
  return response.json();
}

export async function fetchPublicSettings() {
  const response = await fetch(`${API_BASE}/settings`, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error('Failed to fetch public settings');
  return response.json();
}

export async function fetchPosts(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}/posts?${query}`, { next: { revalidate: 120 } });
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
}

export async function fetchDashboardPosts(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const hasParams = Object.keys(params).length > 0;
  // When params are provided (like for edit forms), disable cache
  const url = `${API_BASE}/dashboard/posts?${query}`;
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('toolnavix_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  
  const response = await fetch(url, { 
    method: 'GET',
    headers,
    cache: hasParams ? 'no-store' : 'default'
  });
  
  if (!response.ok) throw new Error('Failed to fetch dashboard posts');
  return response.json();
}

export async function fetchPost(slug: string) {
  const response = await fetch(`${API_BASE}/posts/${slug}`, { next: { revalidate: 120 } });
  if (!response.ok) throw new Error('Post not found');
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

export async function deleteUser(userId: number) {
  return authFetch(`${API_BASE}/dashboard/users/${userId}`, { method: 'DELETE' });
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

export async function createTool(payload: Record<string, unknown> | FormData) {
  if (payload instanceof FormData) {
    return authFetch(`${API_BASE}/tools`, { method: 'POST', body: payload });
  }

  return authFetch(`${API_BASE}/tools`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateTool(toolId: number, payload: Record<string, unknown> | FormData) {
  if (payload instanceof FormData) {
    if (!payload.has('_method')) {
      payload.append('_method', 'PUT');
    }
    return authFetch(`${API_BASE}/tools/${toolId}`, { method: 'POST', body: payload });
  }

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

export async function fetchSavedTools(page = 1) {
  return authFetch(`${API_BASE}/saved-tools?page=${page}`);
}

export async function saveTool(toolId: number) {
  return authFetch(`${API_BASE}/saved-tools`, { method: 'POST', body: JSON.stringify({ tool_id: toolId }) });
}

export async function removeSavedTool(savedId: number) {
  return authFetch(`${API_BASE}/saved-tools/${savedId}`, { method: 'DELETE' });
}

export async function createPost(payload: Record<string, unknown> | FormData) {
  if (payload instanceof FormData) {
    return authFetch(`${API_BASE}/posts`, { method: 'POST', body: payload });
  }

  return authFetch(`${API_BASE}/posts`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updatePost(postId: number, payload: Record<string, unknown> | FormData) {
  if (payload instanceof FormData) {
    if (!payload.has('_method')) {
      payload.append('_method', 'PUT');
    }
    return authFetch(`${API_BASE}/posts/${postId}`, { method: 'POST', body: payload });
  }

  return authFetch(`${API_BASE}/posts/${postId}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deletePost(postId: number) {
  return authFetch(`${API_BASE}/posts/${postId}`, { method: 'DELETE' });
}

export async function bulkDeleteTools(ids: number[]) {
  return authFetch(`${API_BASE}/tools`, { method: 'DELETE', body: JSON.stringify({ ids }) });
}

export async function bulkDeleteCategories(ids: number[]) {
  return authFetch(`${API_BASE}/categories`, { method: 'DELETE', body: JSON.stringify({ ids }) });
}

export async function bulkDeletePosts(ids: number[]) {
  return authFetch(`${API_BASE}/posts`, { method: 'DELETE', body: JSON.stringify({ ids }) });
}

export async function bulkDeleteUsers(ids: number[]) {
  return authFetch(`${API_BASE}/dashboard/users`, { method: 'DELETE', body: JSON.stringify({ ids }) });
}

export async function bulkDeleteReviews(ids: number[]) {
  return authFetch(`${API_BASE}/dashboard/reviews`, { method: 'DELETE', body: JSON.stringify({ ids }) });
}
