// Shared auth helpers for RBAC and tenant scoping
export interface AuthUser {
  id?: string
  roles?: string[]
  tenants?: Array<string | { id?: string; value?: string } | { tenant?: unknown }>
}

export const isSuperAdmin = (user?: AuthUser | null) =>
  Boolean(user?.roles?.includes('super-admin'))

// Normalize tenant identifiers from plugin-provided tenants array rows and raw IDs
export const getTenantIds = (user?: AuthUser | null) => {
  if (!user?.tenants) return []

  return user.tenants
    .map((tenant) => {
      if (typeof tenant === 'string') return tenant

      if (typeof tenant === 'object' && tenant !== null && 'tenant' in tenant) {
        const ref = (tenant as { tenant?: unknown }).tenant
        if (typeof ref === 'string') return ref
        if (typeof ref === 'object' && ref !== null) {
          return (ref as { id?: string; value?: string }).id || (ref as { value?: string }).value
        }
      }

      return (
        (tenant as { id?: string; value?: string })?.id || (tenant as { value?: string })?.value
      )
    })
    .filter(Boolean) as string[]
}
