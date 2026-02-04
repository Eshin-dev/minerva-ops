import type { CollectionConfig } from 'payload'

const isSuperAdmin = ({ req: { user } }: { req: { user: any } }) =>
  Array.isArray(user?.roles) && user.roles.includes('super-admin')

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['tenant-editor'],
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Tenant Admin', value: 'tenant-admin' },
        { label: 'Tenant Editor', value: 'tenant-editor' },
      ],
      saveToJWT: true,
      access: {
        create: isSuperAdmin,
        update: isSuperAdmin,
      },
    },
  ],
}
