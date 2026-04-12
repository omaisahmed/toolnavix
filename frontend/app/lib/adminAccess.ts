import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { isUnauthorizedError } from './api';

export function handleAdminAccessError(router: AppRouterInstance, error: unknown): boolean {
  if (!isUnauthorizedError(error)) {
    return false;
  }

  const hasToken =
    typeof window !== 'undefined' && Boolean(window.localStorage.getItem('toolnavix_token'));

  if (hasToken) {
    router.replace('/');
    return true;
  }

  router.replace('/login');
  return true;
}
