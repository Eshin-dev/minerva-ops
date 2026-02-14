import type { Access, CollectionConfig } from 'payload'

import type { AuthUser } from '../lib/auth'
import { getTenantIds, isSuperAdmin } from '../lib/auth'

const readTenantAccess: Access = ({ req: { user } }) => {
  if (isSuperAdmin(user as AuthUser)) return true

  const tenantIds = getTenantIds(user as AuthUser)
  if (tenantIds.length === 0) return false

  return {
    id: {
      in: tenantIds,
    },
  }
}

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    create: ({ req: { user } }) => isSuperAdmin(user as AuthUser),
    read: readTenantAccess,
    update: ({ req: { user } }) => isSuperAdmin(user as AuthUser),
    delete: ({ req: { user } }) => isSuperAdmin(user as AuthUser),
    admin: ({ req: { user } }) => isSuperAdmin(user as AuthUser),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'domains',
      type: 'array',
      fields: [
        {
          name: 'domain',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
