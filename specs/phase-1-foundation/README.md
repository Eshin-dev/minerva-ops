# Phase 1: Foundation Specification

## Goals

- Stand up multi-tenant-ready Payload CMS on Next.js 15.
- Wire existing MongoDB Atlas cluster via secrets; validate connectivity and backups.
- Deploy to Kubernetes with HA defaults and HPA.
- Implement baseline authentication (users + roles) and tenant-aware access guardrails.

## Deliverables

- Running Payload instance with multi-tenant plugin enabled and tenant collection present.
- MongoDB Atlas connection (provided cluster/user) wired through secrets and validated.
- Kubernetes manifests/helm values for app, secrets, HPA, and ingress.
- Auth-ready `Users` collection with super-admin bootstrap path.

## Scope

- Covers setup and infra needed to serve admin and API for a single environment (dev/stage/prod per cluster).
- Tenant creation flow exists via Payload admin; no frontend theming yet.
- No CDN, cache, or observability stack (add later phases).

## Prerequisites

- MongoDB Atlas cluster already provisioned with DB user and SRV URL.
- Secrets available: `PAYLOAD_SECRET`, provided `DATABASE_URL` (MongoDB Atlas SRV), `JWT_SECRET` (if distinct), `CLOUD_STORAGE` values if media storage is externalized.
- Kubernetes cluster reachable with kubectl context set.
- Domain(s) reserved for admin and app; TLS via Lets Encrypt (ingress controller with cert-manager assumed).

## Workstreams

### 1) Payload App & Multi-Tenant Plugin

- Enable multi-tenant plugin in Payload config.
- Ensure `tenants` collection exists and matches the schema in ../multi-tenant-cms-architecture.md (name, slug, domain, branding group).
- Add tenant field injection to collections via plugin; confirm auto-assignment on create and query scoping.
- Enforce access: super-admin can see all tenants; tenant users restricted to their tenant (overrideAccess: false when passing user).
- Verify domain-based routing logic aligns with `/((?!admin|api)):path*` -> `/:tenantDomain/:path*` pattern.

### 2) MongoDB Atlas Wiring (existing cluster)

- Use provided cluster/user/SRV string; store in secret `DATABASE_URL`.
- Verify network access from cluster (VPC peering/allowlist already set); if blocked, add the app egress CIDR.
- Confirm backups are enabled and retention matches env (dev shorter, prod longer).
- Sanity test connectivity locally with the provided `DATABASE_URL` before deploying.

### 3) Kubernetes Deployment (Baseline)

- Namespace: `minerva` (or environment-specific: `minerva-dev`, `minerva-prod`).
- Secrets: store `PAYLOAD_SECRET`, `DATABASE_URL`, `JWT_SECRET`, storage creds.
- ConfigMap: non-sensitive configs (e.g., `PAYLOAD_CONFIG_PATH`, `NEXT_PUBLIC_SITE_URL`).
- Deployment:
  - Replicas: 2 minimum.
  - Resources: request 250m CPU / 512Mi; limit 500m / 1Gi (tune per env).
  - Liveness/readiness probes: HTTP `/api/health` (add route if missing).
  - Env vars wired from secrets/config.
- HPA: min 2, max 10 replicas; scale on CPU 60% target (add memory if needed).
- Service: ClusterIP exposing app port (default 3000).
- Ingress: routes admin and app domains; terminates TLS via cert-manager.
- Storage: ensure uploads are not local; wire S3-compatible storage if used in Phase 1 (else block local writes or mark as TODO for Phase 2).

### 4) Authentication Baseline

- `Users` collection with `auth: true`; include roles with `saveToJWT: true`.
- Roles: `super-admin`, `tenant-admin`, `tenant-editor` minimum.
- Access guards:
  - Super-admin: full access.
  - Tenant roles: scoped to tenant via query constraints; no cross-tenant reads/writes.
- Session settings: secure cookies, reasonable expiry, HTTPS-only in non-dev.
- Bootstrap flow: seed one super-admin user (script or migration) with strong password; disable default/admin defaults.

## Acceptance Criteria

- App boots and serves admin UI with multi-tenant plugin active; tenant collection visible and CRUD works.
- Creating a document auto-assigns tenant; scoped queries prevent cross-tenant access in manual tests.
- Atlas connection stable; backups enabled; secrets not in repo.
- Kubernetes deployment runs with 2 replicas, HPA configured, ingress terminating TLS.
- Auth works end-to-end: login, role in JWT, access checks enforced with `overrideAccess: false` when user is present.

## Out of Scope (Phase 1)

- Frontend theming and tenant-specific styles.
- Observability (logs/metrics/dashboards) beyond basic k8s events.
- CDN, caching, and edge delivery.
- Advanced content blocks beyond minimal admin CRUD.

## References

- Master architecture spec: ../multi-tenant-cms-architecture.md
- Security patterns: `.cursor/rules/security-critical.md` (local) and project root instructions.
