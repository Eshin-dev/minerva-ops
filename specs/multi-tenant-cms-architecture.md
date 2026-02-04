# Multi-Tenant CMS Architecture Specification

**Version:** 1.0  
**Date:** January 31, 2026  
**Status:** Draft

---

## Executive Summary

This specification outlines a multi-tenant content management system (CMS) solution built with Payload CMS and Next.js. The system enables a single application instance to serve multiple client websites with isolated data, customizable branding, and a reusable component library. This architecture is designed for agencies managing multiple small business client websites efficiently.

---

## 1. System Overview

### 1.1 Purpose

Provide a scalable, cost-effective platform for deploying and managing multiple client websites from a single codebase while maintaining:

- Complete data isolation between clients (tenants)
- Customizable branding and styling per tenant
- Reusable content blocks and components
- Non-technical content management capabilities

### 1.2 Key Benefits

- **Single Codebase**: One application serves all client sites
- **Cost Efficiency**: Shared infrastructure reduces hosting costs
- **Rapid Deployment**: New client sites can be provisioned in minutes
- **Centralized Maintenance**: Updates and improvements benefit all clients
- **Scalability**: Horizontal scaling via Kubernetes HPA

---

## 2. Technical Architecture

### 2.1 Technology Stack

**Backend:**

- Payload CMS (v3.x)
- MongoDB (via MongoDB Atlas)
- Node.js runtime

**Frontend:**

- Next.js (App Router)
- React components
- TypeScript

**Infrastructure:**

- Linode Kubernetes Engine (LKE)
- MongoDB Atlas (managed database)
- Linode Object Storage (S3-compatible for media)
- Let's Encrypt (SSL certificates)

### 2.2 Application Structure

```
┌─────────────────────────────────────────┐
│   Single Next.js + Payload Application  │
│   - Payload Admin Panel                 │
│   - Next.js Frontend                    │
│   - Shared Component Library            │
└─────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │   MongoDB Atlas       │
        │   - Tenant data       │
        │   - Pages/Posts/Media │
        │   - User accounts     │
        └───────────────────────┘
                    ↓
    ┌───────────────────────────────┐
    │  Multiple Client Domains:     │
    │  - client-a.com               │
    │  - client-b.com               │
    │  - client-c.com               │
    └───────────────────────────────┘
```

---

## 3. Multi-Tenancy Implementation

### 3.1 Core Concept

- **Shared Infrastructure**: All tenants use the same application and database
- **Data Isolation**: Automatic query filtering ensures tenants only access their own data
- **Domain-Based Routing**: Each tenant has their own custom domain

### 3.2 Tenant Configuration

#### Tenants Collection Schema

```typescript
{
  slug: 'tenants',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true
    },
    {
      name: 'domain',
      type: 'text',
      required: true
    },
    {
      name: 'branding',
      type: 'group',
      fields: [
        { name: 'primaryColor', type: 'text' },
        { name: 'secondaryColor', type: 'text' },
        { name: 'fontFamily', type: 'select' },
        { name: 'logo', type: 'upload' },
        { name: 'buttonStyle', type: 'select' }
      ]
    }
  ]
}
```

### 3.3 Access Control

**Automatic Tenant Scoping:**

- All queries automatically filtered by tenant relationship
- Users can only access data for their assigned tenant
- Super-admin role can access all tenants for management

**Implementation:**

- `multiTenantPlugin` automatically adds tenant field to collections
- Access control functions return query constraints
- Hooks auto-assign tenant on document creation

### 3.4 Domain Routing

**Next.js Rewrites:**

- Extract tenant domain from request host header
- Route to tenant-specific content
- Pattern: `/((?!admin|api)):path*` → `/:tenantDomain/:path*`

---

## 4. Content Management

### 4.1 Collections

#### Pages Collection

- **Purpose**: Flexible page creation for each tenant
- **Features**:
  - Slug-based routing
  - Blocks field for flexible layouts
  - SEO metadata
  - Draft/published states
  - Live preview

#### Posts/Blog Collection

- **Purpose**: Blog content management
- **Features**:
  - Rich text editor (Lexical)
  - Featured images
  - Author, publish date
  - Categories/tags

#### Media Collection

- **Purpose**: Image and file management
- **Features**:
  - Upload to Object Storage
  - Automatic image optimization
  - Multiple size variants
  - Focal point selection
  - Alt text and captions

### 4.2 Content Blocks System

**Block Architecture:**

- Blocks are reusable content modules
- Each block has a backend schema (Payload) and frontend component (React)
- Users compose pages by stacking blocks

**Standard Block Library:**

1. **Hero Block**
   - Heading, subheading
   - Background image/video
   - CTA button

2. **Text Content Block**
   - Rich text editor
   - Column layouts

3. **Image Gallery Block**
   - Multiple images
   - Layout options (grid, carousel)

4. **Call-to-Action Block**
   - Heading, description
   - Button with link

5. **Testimonials Block**
   - Quote, author, avatar
   - Multiple testimonials

6. **Services/Features Block**
   - Icon, title, description
   - Grid layout

7. **Contact Form Block**
   - Configurable form fields
   - Email notifications

---

## 5. Reusable Component Library

### 5.1 Component Structure

**Two-Part System:**

1. **Backend Schema (Payload Block)**
   - Defines data structure
   - Field validations
   - Admin UI configuration

2. **Frontend Component (React)**
   - Visual rendering
   - Styling application
   - Tenant-aware theming

### 5.2 Component Design Principles

- **Stateless**: No internal state that prevents scaling
- **Theme-aware**: Accept tenant branding configuration
- **Accessible**: WCAG 2.1 AA compliance
- **Responsive**: Mobile-first design
- **Performant**: Optimized images, lazy loading

### 5.3 Block-to-Component Mapping

```tsx
// Block type mapping
const blockComponents = {
  hero: HeroComponent,
  textContent: TextContentComponent,
  imageGallery: ImageGalleryComponent,
  cta: CTAComponent,
  testimonials: TestimonialsComponent,
  services: ServicesComponent,
  contactForm: ContactFormComponent,
}

// Rendering
{
  page.layout.map((block, index) => {
    const Component = blockComponents[block.blockType]
    return <Component key={index} {...block} tenant={tenant} />
  })
}
```

---

## 6. Tenant-Specific Styling

### 6.1 Branding System

**Customizable Properties:**

- Primary, secondary, accent colors
- Typography (font families, sizes, weights)
- Logo and favicon
- Button styles (rounded, square, pill)
- Spacing and layout preferences
- Border radius values

### 6.2 Implementation Approach

**CSS Variables Method:**

```tsx
// Generate CSS variables from tenant settings
<style>{`
  :root {
    --color-primary: ${tenant.branding.primaryColor};
    --color-secondary: ${tenant.branding.secondaryColor};
    --font-family: ${tenant.branding.fontFamily};
    --button-radius: ${tenant.branding.buttonRadius};
  }
`}</style>
```

**Component Usage:**

```tsx
export const Hero = ({ heading, image, tenant }) => {
  return (
    <section
      className="hero"
      style={{
        backgroundColor: tenant.branding.primaryColor,
        fontFamily: tenant.branding.fontFamily,
      }}
    >
      <h1>{heading}</h1>
    </section>
  )
}
```

### 6.3 Style Isolation

- Each tenant's styles applied at runtime
- No CSS conflicts between tenants
- Shared base styles with tenant overrides
- Theme settings stored in database

---

## 7. Infrastructure & Deployment

### 7.1 Kubernetes Architecture

**Deployment Configuration:**

- Minimum 2 pods for high availability
- Horizontal Pod Autoscaler (HPA) enabled
- CPU/Memory-based scaling triggers
- NodeBalancer for load distribution

**Resource Specifications:**

- Initial: 2× 2GB Linode nodes
- Scalable to 4GB nodes as needed
- HPA: min 2, max 10 replicas

### 7.2 Database Strategy

**MongoDB Atlas:**

- Recommended tier: M10 (production)
- Budget tier: M2 (small deployments)
- Connection pooling per pod
- Automatic backups enabled

### 7.3 Media Storage

**Linode Object Storage:**

- S3-compatible API
- Payload cloud storage adapter
- CDN-ready URLs
- Public read access for published assets

### 7.4 Stateless Design Requirements

**Critical for Scaling:**

- No local file uploads (use Object Storage)
- No session storage on disk (use database/JWT)
- Standalone Next.js build output
- Database-backed authentication

---

## 8. Cost Projections

### 8.1 Initial Setup (3-4 Clients)

**Budget Configuration:**

- LKE (2× 2GB nodes): $24/month
- NodeBalancer: $10/month
- MongoDB Atlas M2: $9/month
- Object Storage: $5/month
- **Total: ~$48/month**
- **Per-client cost: $12-16/month**

**Production Configuration:**

- LKE (2× 4GB nodes): $48/month
- NodeBalancer: $10/month
- MongoDB Atlas M10: $57/month
- Object Storage: $5/month
- **Total: ~$120/month**
- **Per-client cost: $30-40/month**

### 8.2 Scaling Economics

**10 Clients:**

- Same infrastructure handles load
- Potential upgrade to 4GB nodes
- Total cost: ~$120-150/month

**20+ Clients:**

- Add 1 more node: +$24/month
- Upgrade to M20 database: ~$130/month
- Total cost: ~$180-200/month
- **Per-client cost drops to $9-10/month**

---

## 9. User Roles & Permissions

### 9.1 Role Definitions

**Super Admin (Agency):**

- Access to all tenants
- Create/manage tenants
- Global settings
- User management across tenants

**Tenant Admin (Client):**

- Access only to their tenant
- Manage pages, posts, media
- Update content
- Cannot see other tenants

**Tenant Editor (Client Staff):**

- Create/edit content
- Cannot publish
- Cannot access settings

### 9.2 Authentication Flow

1. User logs into Payload admin
2. System checks user's tenant assignment
3. Queries automatically scoped to user's tenant
4. Admin UI filtered to show only accessible content

---

## 10. Development Workflow

### 10.1 Adding New Client

1. Create new tenant record in Payload admin
2. Set domain, slug, branding settings
3. Point client domain DNS to application
4. Create initial admin user for client
5. Client can immediately start adding content

**Time to deploy: <30 minutes**

### 10.2 Block Development

1. Define Payload block schema
2. Create React component
3. Add to block component mapping
4. Test with different tenant themes
5. Deploy - available to all tenants

### 10.3 Theme Customization

1. Navigate to Tenants collection
2. Select client tenant
3. Update branding fields (color picker UI)
4. Upload new logo
5. Save - changes reflected immediately

---

## 11. Rich Text Editing

### 11.1 Editor Choice

**Lexical Editor (Recommended):**

- Modern WYSIWYG experience
- Inline image uploads
- Custom blocks within content
- Extensible features

### 11.2 Features Available to Users

- Bold, italic, underline formatting
- Headings (H2-H6)
- Lists (ordered, unordered)
- Links with custom attributes
- Blockquotes
- Image uploads with captions
- Media embeds
- Custom content blocks

---

## 12. SEO & Performance

### 12.1 SEO Capabilities

**Per-Page Configuration:**

- Meta title and description
- Open Graph tags
- Twitter card metadata
- Canonical URLs
- Structured data (JSON-LD)

**Site-Wide (Per Tenant):**

- Default meta tags
- Favicon
- Sitemap generation
- Robots.txt

### 12.2 Performance Optimizations

- Next.js automatic code splitting
- Image optimization (responsive sizes)
- Static page generation where possible
- CDN for media assets
- Database connection pooling
- Kubernetes horizontal scaling

---

## 13. Security Considerations

### 13.1 Data Isolation

- Query-level tenant filtering (cannot be bypassed)
- Database-enforced relationships
- Access control at API level
- Separate user pools per tenant

### 13.2 Authentication

- JWT-based authentication
- Secure cookie handling
- Password hashing (bcrypt)
- Session management

### 13.3 File Upload Security

- MIME type validation
- File size limits
- Virus scanning (optional, recommended)
- Secure URLs with signed requests (optional)

---

## 14. Monitoring & Maintenance

### 14.1 Metrics to Track

**Application:**

- Request rate per tenant
- Error rates
- Response times
- Database query performance

**Infrastructure:**

- CPU/memory usage per pod
- HPA scaling events
- Database connections
- Storage usage

### 14.2 Backup Strategy

- MongoDB Atlas automated backups
- Object Storage versioning
- Configuration exports
- Disaster recovery plan

---

## 15. Future Enhancements

### 15.1 Potential Features

- **Advanced Analytics**: Per-tenant Google Analytics
- **E-commerce Blocks**: Product listings, shopping cart
- **Form Builder**: Custom form creation
- **Email Marketing**: Integration with email providers
- **A/B Testing**: Content variation testing
- **Multilingual Support**: Multi-language content
- **Advanced Permissions**: Custom role definitions
- **White-Label Admin**: Tenant-branded admin panels

### 15.2 Scaling Considerations

- Redis cache layer for improved performance
- Read replicas for database
- CDN integration for static assets
- Edge deployment for global performance

---

## 16. Success Criteria

### 16.1 Technical Metrics

- ✅ Sub-second page load times (p95)
- ✅ 99.9% uptime
- ✅ Complete data isolation (zero cross-tenant data leaks)
- ✅ Successful auto-scaling under load
- ✅ <30 minutes new client deployment

### 16.2 Business Metrics

- ✅ <$20/month cost per client at scale
- ✅ Non-technical users can manage content independently
- ✅ Single developer can maintain system
- ✅ New blocks deployable to all clients in one update

---

## 17. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

- Set up Payload with multi-tenant plugin
- Configure MongoDB Atlas
- Deploy to Kubernetes cluster
- Implement basic authentication

### Phase 2: Core Blocks (Weeks 3-4)

- Develop 5-7 essential content blocks
- Create React component library
- Implement tenant theming system
- Build Pages and Posts collections

### Phase 3: Polish & Testing (Week 5)

- Add SEO features
- Implement media optimization
- Performance testing
- Security audit

### Phase 4: Pilot Launch (Week 6)

- Deploy first 2-3 client sites
- User acceptance testing
- Documentation
- Refinements

### Phase 5: Scale (Ongoing)

- Onboard additional clients
- Add new blocks as needed
- Monitor and optimize
- Feature enhancements

---

## 18. Risks & Mitigations

| Risk                       | Impact   | Mitigation                                                          |
| -------------------------- | -------- | ------------------------------------------------------------------- |
| Database connection limits | High     | Use connection pooling, monitor connections, upgrade tier if needed |
| Single point of failure    | High     | Kubernetes HA, minimum 2 pods, database backups                     |
| Cross-tenant data leak     | Critical | Automated testing, query auditing, access control reviews           |
| Runaway costs              | Medium   | Set up billing alerts, implement rate limiting, monitor usage       |
| Performance degradation    | Medium   | HPA auto-scaling, database indexing, caching strategy               |

---

## 19. Documentation Requirements

### 19.1 Technical Documentation

- Architecture diagrams
- API documentation
- Database schema
- Deployment procedures
- Troubleshooting guides

### 19.2 User Documentation

- Content editor guide
- Block usage examples
- Media management
- SEO best practices
- FAQ

---

## 20. Conclusion

This multi-tenant architecture provides a robust, scalable foundation for managing multiple client websites efficiently. By leveraging Payload CMS's flexibility, Next.js's performance, and Kubernetes's scalability, the system delivers:

- **Economic Efficiency**: 70-80% cost reduction vs. separate hosting
- **Development Velocity**: Rapid client onboarding and feature deployment
- **User Empowerment**: Non-technical content management
- **Technical Excellence**: Modern stack with proven scalability

The architecture is designed to start small (3-4 clients) and scale to dozens of clients without significant re-architecture, making it ideal for growing agencies and multi-site operations.

---

## Appendix A: Key Technologies

- **Payload CMS**: https://payloadcms.com
- **Next.js**: https://nextjs.org
- **MongoDB Atlas**: https://www.mongodb.com/atlas
- **Linode Kubernetes Engine**: https://www.linode.com/products/kubernetes/
- **Linode Object Storage**: https://www.linode.com/products/object-storage/

## Appendix B: Glossary

- **Tenant**: An individual client or organization using the system
- **Block**: A reusable content module (e.g., Hero, CTA)
- **Collection**: A Payload CMS content type (e.g., Pages, Posts)
- **HPA**: Horizontal Pod Autoscaler (Kubernetes scaling mechanism)
- **Multi-tenancy**: Single application serving multiple isolated clients

---

**Document Control:**

- Author: System Architecture Team
- Review Date: Every quarter
- Next Review: April 30, 2026
