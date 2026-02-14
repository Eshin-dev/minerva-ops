import type { Access, CollectionConfig, Where } from 'payload'
import { tenantsArrayField } from '@payloadcms/plugin-multi-tenant/fields'

import type { AuthUser } from '../lib/auth'
import { getTenantIds, isSuperAdmin } from '../lib/auth'

// Allow super-admins, otherwise scope to the user's own record or tenants they belong to
const tenantScopedAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user as AuthUser)) return true

  const tenantIds = getTenantIds(user as AuthUser)

  const constraints: Where[] = [{ id: { equals: (user as AuthUser).id } }]

  if (tenantIds.length > 0) {
    constraints.push({ 'tenants.tenant': { in: tenantIds } })
  }

  if (constraints.length === 1) return constraints[0]

  return { or: constraints }
}

// Allow super-admins or the user acting on themselves
const selfOrSuperAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user as AuthUser)) return true

  return {
    id: {
      equals: (user as AuthUser).id,
    },
  }
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => {
      if (!user) return false
      if (isSuperAdmin(user as AuthUser)) return true

      return (user as AuthUser).roles?.includes('tenant-admin') ?? false
    },
    read: tenantScopedAccess,
    update: selfOrSuperAccess,
    delete: ({ req: { user } }) => isSuperAdmin(user as AuthUser),
  },
  fields: [
    {
      // Simple RBAC with super-admin override and tenant-admin default
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Tenant Admin', value: 'tenant-admin' },
      ],
      defaultValue: ['tenant-admin'],
      required: true,
      saveToJWT: true,
      access: {
        update: ({ req: { user } }) => isSuperAdmin(user as AuthUser),
      },
    },
    {
      // Plugin-provided tenants array; saved to JWT for fast scoping
      ...tenantsArrayField({
        arrayFieldAccess: {
          read: ({ req: { user } }) => Boolean(user),
          update: ({ req: { user } }) => isSuperAdmin(user as AuthUser),
        },
        tenantFieldAccess: {
          read: ({ req: { user } }) => Boolean(user),
          update: ({ req: { user } }) => isSuperAdmin(user as AuthUser),
        },
      }),
      saveToJWT: true,
    },
  ],
  hooks: {
    beforeChange: [
      // On user create by tenant-admin, copy their tenants and default role
      ({ data, req, operation }) => {
        if (operation !== 'create') return data

        const requester = req.user as AuthUser | undefined
        if (!requester || isSuperAdmin(requester)) return data

        const tenantIds = getTenantIds(requester)

        return {
          ...data,
          tenants: tenantIds.map((id) => ({ tenant: id })),
          roles: data?.roles ?? ['tenant-admin'],
        }
      },
    ],
  },
}
