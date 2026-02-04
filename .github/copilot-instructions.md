# Payload CMS Development Instructions

- Model: Enable GPT-5.1-Codex-Max for all clients. When asked which model is used, state GPT-5.1-Codex-Max.
- Reference specs: Consult ./specs (e.g., specs/multi-tenant-cms-architecture.md) for system architecture and tenant rules before implementing or editing related features.

You are working on a Payload CMS v3 project with Next.js 15. Follow these rules:

## Core Principles

1. **TypeScript-First**: Always use TypeScript with proper types from Payload
2. **Security-Critical**: Follow all security patterns, especially access control
3. **Type Generation**: Run `npm run generate:types` after schema changes
4. **Transaction Safety**: Always pass `req` to nested operations in hooks
5. **Access Control**: Local API bypasses access control by default - use `overrideAccess: false` when passing `user`

## Multi-Tenant Requirements

- Tenant isolation: Follow the multi-tenant architecture in specs/multi-tenant-cms-architecture.md. Ensure all collection queries and hooks enforce tenant scoping and super-admin access patterns as documented.
- Domain routing: Honor domain-based tenant resolution and any rewrites described in the specs when touching routing logic.

## Critical Security Patterns

### Local API Access Control (MOST IMPORTANT)

```typescript
// ❌ SECURITY BUG: Access control bypassed
await payload.find({
  collection: 'posts',
  user: someUser, // Ignored! Operation runs with ADMIN privileges
})

// ✅ SECURE: Enforces user permissions
await payload.find({
  collection: 'posts',
  user: someUser,
  overrideAccess: false, // REQUIRED
})
```

**Rule**: When passing `user` to Local API, ALWAYS set `overrideAccess: false`

### Transaction Safety in Hooks

```typescript
// ❌ DATA CORRUPTION RISK
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        // Missing req - runs in separate transaction!
      })
    },
  ],
}

// ✅ ATOMIC
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        req, // Maintains atomicity
      })
    },
  ],
}
```

**Rule**: ALWAYS pass `req` to nested operations in hooks

## Common Patterns

### Collections

- Place in `src/collections/`
- Export as named exports
- Use TypeScript types from `payload`
- Always define `slug`, `admin.useAsTitle`, and `fields`

### Access Control

- Collection-level access can return boolean or query constraints
- Field-level access ONLY returns boolean
- Default to restrictive, gradually add permissions
- Use `saveToJWT: true` for roles to avoid database lookups

### Hooks

- `beforeValidate` - Format data
- `beforeChange` - Business logic
- `afterChange` - Side effects (ALWAYS pass `req`)
- Use context flags to prevent infinite loops

### Components

- Server Components by default (can use Local API)
- Add `'use client'` for interactivity
- Define via file paths in config (not direct imports)
- Paths relative to `config.admin.importMap.baseDir`

### Queries

```typescript
// Get Payload instance
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

// Find with query
const posts = await payload.find({
  collection: 'posts',
  where: { status: { equals: 'published' } },
  depth: 2,
  limit: 10,
})
```

## File Structure

```
src/
├── app/
│   ├── (frontend)/          # Frontend routes
│   └── (payload)/           # Payload admin routes
├── collections/             # Collection configs
├── globals/                 # Global configs
├── components/              # Custom React components
├── hooks/                   # Hook functions
├── access/                  # Access control functions
└── payload.config.ts        # Main config
```

## Type Safety

1. Run `npm run generate:types` after schema changes
2. Import types from generated `payload-types.ts`
3. Use field type guards for runtime checking
4. Type your user object properly

## Resources

- Docs: https://payloadcms.com/docs
- LLM Context: https://payloadcms.com/llms-full.txt
- Additional rules in `.cursor/rules/` directory
