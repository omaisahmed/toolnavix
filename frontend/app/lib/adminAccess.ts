import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { isUnauthorizedError } from './api';

export function handleAdminAccessError(router: AppRouterInstance, error: unknown): boolean {
  if (!isUnauthorizedError(error)) {
    return false;
  }

  router.replace('/login');
  return true;
}
