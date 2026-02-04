import type { CollectionConfig } from 'payload'

const isSuperAdmin = ({ req: { user } }: { req: { user: any } }) =>
  Array.isArray(user?.roles) && user.roles.includes('super-admin')

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    create: isSuperAdmin,
    update: isSuperAdmin,
    delete: isSuperAdmin,
    read: ({ req: { user } }) => Boolean(user),
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
      name: 'domain',
      type: 'text',
      required: true,
    },
    {
      name: 'branding',
      type: 'group',
      fields: [
        { name: 'primaryColor', type: 'text' },
        { name: 'secondaryColor', type: 'text' },
        { name: 'fontFamily', type: 'select', options: ['sans', 'serif', 'mono'] },
        { name: 'logo', type: 'upload', relationTo: 'media' },
        { name: 'buttonStyle', type: 'select', options: ['rounded', 'square', 'pill'] },
      ],
    },
  ],
}
