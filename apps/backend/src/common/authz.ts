import type { AuthUser } from './types';

export const hasAdminAccess = (user: Pick<AuthUser, 'groups'> | null | undefined) =>
  user?.groups?.includes('Admin') ?? false;

export const isProtectedSuperAdmin = (
  user: Pick<AuthUser, 'isSuperAdmin'> | null | undefined,
) => user?.isSuperAdmin ?? false;
