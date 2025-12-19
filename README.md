# Ops Platform

A multi-tenant incident management platform built with Next.js, Prisma, and PostgreSQL.

## Tech Stack

- **Framework**: Next.js 16
- **Database**: PostgreSQL 16
- **ORM**: Prisma 7
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS 4
- **Testing**: Jest + Testing Library
- **Language**: TypeScript

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/sammainahkinya1404/ops-platform.git
cd ops-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Database

Start PostgreSQL using Docker Compose:

```bash
docker-compose up -d
```

This starts a PostgreSQL 16 container with:
- **Host**: localhost
- **Port**: 5432
- **Database**: ops_platform
- **User**: postgres
- **Password**: 1234

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:1234@localhost:5432/ops_platform"
AUTH_SECRET="your-super-secret-key-change-this-in-production"
AUTH_URL="http://localhost:3000"
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Run Database Migrations

```bash
npx prisma migrate dev
```

### 7. Seed the Database

```bash
npx prisma db seed
```

This creates sample data:
- **2 Tenants**: Acme Corporation, TechStart Inc
- **3 Users**:
  - alice@example.com (Admin in both tenants)
  - bob@example.com (Engineer in both tenants)
  - charlie@example.com (Viewer in Acme only)
- **Password for all users**: `password123`
- **45 Incidents** with timeline events
- **30 Feature flags** across environments

### 8. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Multi-Tenant Architecture
- Users can belong to multiple organizations (tenants)
- Role-based access control (ADMIN, ENGINEER, VIEWER)
- Tenant-scoped data isolation

### Tenant Selection
- Home page displays all tenants the user has access to
- Shows user's role in each tenant
- Easy navigation between organizations

### Incident Management
- **List View**: Filterable, searchable, paginated incident list
- **Filters**: Status (Open/Mitigated/Resolved), Severity (SEV1-4), Environment (Dev/Staging/Prod)
- **Search**: Search by title or service name
- **Create**: Form to create new incidents with severity, service, environment, and tags
- **Detail View**: Full incident details with metadata and tags
- **Timeline**: Visual timeline of all incident events (notes, status changes, actions)
- **Status Workflow**: Change status (OPEN → MITIGATED → RESOLVED) with validation
- **Notes**: Add notes to incident timeline
- **Audit Trail**: All actions are logged for compliance

### Feature Flags
- **List View**: View all flags by environment (DEV/STAGING/PROD)
- **Environment Selector**: Quick switching between environments
- **Evaluation Engine**: Deterministic percentage rollouts and allowlist rules
- **Composable Rules**: Support for AND/OR rule composition
- **Evaluation Tool**: Interactive tool to test flag evaluation for any user

## Project Structure

```
ops-platform/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts        # NextAuth API route
│   │   ├── auth/
│   │   │   └── signin/
│   │   │       └── page.tsx            # Login page
│   │   ├── t/
│   │   │   └── [tenantSlug]/
│   │   │       ├── layout.tsx          # Tenant dashboard layout
│   │   │       ├── page.tsx            # Tenant dashboard home
│   │   │       └── incidents/
│   │   │           ├── page.tsx        # Incidents list with filters
│   │   │           ├── new/
│   │   │           │   ├── page.tsx    # Create incident form
│   │   │           │   └── actions.ts  # Server action
│   │   │           └── [incidentId]/
│   │   │               ├── page.tsx    # Incident detail with timeline
│   │   │               └── actions.ts  # Status change & add note
│   │   │       └── flags/
│   │   │           ├── page.tsx        # Feature flags list
│   │   │           └── evaluate/
│   │   │               └── page.tsx    # Flag evaluation tool
│   │   ├── layout.tsx
│   │   └── page.tsx                    # Tenant selection page
│   ├── lib/
│   │   ├── auth.ts                     # NextAuth configuration
│   │   ├── feature-flags.ts            # Flag evaluation engine
│   │   ├── prisma.ts                   # Prisma client singleton
│   │   └── tenant.ts                   # Tenant utility functions
│   ├── __tests__/
│   │   └── feature-flags.test.ts       # Feature flag unit tests
│   └── types/
│       └── next-auth.d.ts              # NextAuth type extensions
├── jest.config.js                      # Jest configuration
├── jest.setup.js                       # Jest setup file
├── prisma/
│   ├── schema.prisma                   # Database schema
│   └── seed.ts                         # Database seed script
├── prisma.config.ts                    # Prisma configuration
├── docker-compose.yml                  # PostgreSQL container config
└── .env                                # Environment variables
```

## Application Routes

| Route | Description |
|-------|-------------|
| `/` | Tenant selection (shows all tenants user has access to) |
| `/auth/signin` | Login page |
| `/t/[tenantSlug]` | Tenant dashboard with statistics |
| `/t/[tenantSlug]/incidents` | Incidents list with filters and pagination |
| `/t/[tenantSlug]/incidents/new` | Create new incident form |
| `/t/[tenantSlug]/incidents/[id]` | Incident detail with timeline, status changes, notes |
| `/t/[tenantSlug]/flags` | Feature flags list by environment |
| `/t/[tenantSlug]/flags/evaluate` | Interactive flag evaluation tool |

## Database Schema

The platform uses a multi-tenant architecture with the following models:

- **Tenant**: Organizations using the platform
- **User**: Platform users (can belong to multiple tenants)
- **Membership**: User-Tenant relationship with roles (ADMIN, ENGINEER, VIEWER)
- **Incident**: Incidents with severity, status, service, and environment
- **TimelineEvent**: Incident timeline (notes, actions, status changes)
- **Attachment**: File attachments for incidents
- **FeatureFlag**: Feature flags per tenant and environment
- **AuditLog**: Audit trail for tenant actions

## Authentication

The platform uses **NextAuth.js v5** (Auth.js) with credentials-based authentication.

### Features

- JWT session strategy
- Email/password authentication with bcrypt
- Custom sign-in page at `/auth/signin`
- Session includes user ID for authorization

### Test Accounts

After seeding the database, you can log in with:

| Email | Password | Role |
|-------|----------|------|
| alice@example.com | password123 | Admin (both tenants) |
| bob@example.com | password123 | Engineer (both tenants) |
| charlie@example.com | password123 | Viewer (Acme only) |

### Auth Files

- `src/lib/auth.ts` - NextAuth configuration with credentials provider
- `src/lib/prisma.ts` - Prisma client singleton with v7 adapter
- `src/app/api/auth/[...nextauth]/route.ts` - API route handlers
- `src/app/auth/signin/page.tsx` - Custom login page
- `src/types/next-auth.d.ts` - TypeScript type extensions

### Usage in Components

```typescript
// Server Component
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/auth/signin");
  return <div>Welcome {session.user.name}</div>;
}

// Client Component
import { useSession } from "next-auth/react";

export default function Component() {
  const { data: session } = useSession();
  return <div>Welcome {session?.user?.name}</div>;
}
```

## Prisma 7 Notes

This project uses Prisma 7, which requires a **driver adapter** instead of direct database URLs. The seed script and any database connections must use the adapter pattern:

```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma migrate dev` | Run migrations |
| `npx prisma db seed` | Seed the database |
| `npx prisma studio` | Open Prisma Studio |

## Testing

The project uses **Jest** with **Testing Library** for unit testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

Currently tested:
- **Feature Flag Evaluation Engine** (8 tests)
  - Percentage rollout (deterministic hashing)
  - Allowlist rules
  - AND/OR rule composition
  - Global flag disable

```
 PASS  src/__tests__/feature-flags.test.ts
  Feature Flag Evaluation
    Percentage Rollout
      ✓ should enable flag for users under threshold
      ✓ should be deterministic for same user
    Allowlist
      ✓ should enable for users in allowlist
      ✓ should disable for users not in allowlist
    AND Logic
      ✓ should enable only if all conditions are met
      ✓ should disable if any condition fails
    OR Logic
      ✓ should enable if any condition is met
    Global Flag Disable
      ✓ should disable flag when globally disabled

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

## Docker Commands

```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v

# View logs
docker-compose logs -f postgres
```

## Architecture Deep Dive

### Tenant Enforcement Strategy

Tenant isolation is enforced at multiple layers to prevent data leakage:

#### 1. Data Access Layer
Every Prisma query includes explicit `tenantId` filtering:

```typescript
// All queries are tenant-scoped
const incidents = await prisma.incident.findMany({
  where: { 
    tenantId: tenant.id,  // Always required
    status: 'OPEN'
  }
});
```

#### 2. Authorization Layer
Before any tenant-scoped operation, we validate access:

```typescript
// src/lib/tenant.ts
export async function validateTenantAccess(userId: string, tenantSlug: string) {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      tenant: { slug: tenantSlug }
    },
    include: { tenant: true }
  });

  if (!membership) {
    throw new Error('Access denied to this tenant');
  }

  return { tenant: membership.tenant, role: membership.role };
}
```

This function is called in every tenant route's `page.tsx` before rendering.

#### 3. Layout Layer
The tenant layout (`src/app/t/[tenantSlug]/layout.tsx`) validates access before rendering any child pages, ensuring users can't access tenants they don't belong to.

#### 4. URL-based Context
Tenant context is derived from the URL (`/t/[tenantSlug]/...`), making it:
- Bookmarkable
- Shareable (with proper auth)
- Easy to reason about
- Explicit (no hidden state)

### Caching & Invalidation Strategy

#### Server Component Caching
- **Default Behavior**: Next.js caches Server Components by default
- **Cache Keys**: Based on route + query parameters
- **Invalidation**: Uses `revalidatePath()` after mutations

#### Example: Incident Creation
```typescript
export async function createIncident(formData: FormData) {
  // ... create incident ...
  
  // Invalidate the incidents list cache
  revalidatePath(`/t/${tenantSlug}/incidents`);
  
  // Redirect to detail page (which has its own cache key)
  redirect(`/t/${tenantSlug}/incidents/${incident.id}`);
}
```

#### URL-Driven State
Filters and pagination are stored in URL query parameters:
- No client-side state to manage
- Shareable filtered views
- Browser back/forward works naturally
- Each filter combination has its own cache key

```typescript
// Different URLs = Different cache entries
/t/acme/incidents?status=OPEN&severity=SEV1
/t/acme/incidents?status=RESOLVED
```

### Real-time Design (Not Implemented)

**Proposed Approach**: Server-Sent Events (SSE)

If implemented, would work as follows:

1. **Client subscribes** to incident timeline:
```typescript
const eventSource = new EventSource(`/api/incidents/${id}/timeline`);
eventSource.onmessage = (event) => {
  // Append new timeline event to UI
};
```

2. **Server pushes updates** when mutations occur:
```typescript
export async function addNote(formData: FormData) {
  const event = await prisma.timelineEvent.create({...});
  
  // Broadcast to all connected clients
  await broadcastEvent(incidentId, event);
}
```

3. **Authentication**: SSE connection includes session cookie
4. **Tenant Scoping**: Events filtered by tenantId before broadcast

### Security Decisions

#### 1. Authentication
- **Session-based** (JWT in HTTP-only cookies)
- **Why**: More secure than localStorage, works with SSR
- **Alternative considered**: API tokens (ruled out - harder to revoke)

#### 2. Password Hashing
- **bcrypt** with 10 salt rounds
- **Why**: Industry standard, slow by design (resists brute force)
- **Alternative considered**: argon2 (overkill for this scale)

#### 3. CSRF Protection
- **Provided by NextAuth.js** automatically
- **Why**: All mutations use Server Actions (CSRF-protected by default)

#### 4. Tenant Isolation
- **Database-level enforcement** (every query filtered)
- **Why**: Prevents accidental leakage at application layer
- **Alternative considered**: Row-level security in Postgres (more complex)

#### 5. Audit Logging
- **Before/After snapshots** stored as JSON
- **Why**: Compliance, debugging, accountability
- **Storage**: Same database (would move to separate audit DB in production)

#### 6. Status Transition Validation
- **Server-side validation** of allowed transitions
- **Why**: Business logic must never trust client
- **Implementation**: Hardcoded state machine in Server Action

```typescript
const validTransitions: Record<string, string[]> = {
  OPEN: ['MITIGATED', 'RESOLVED'],
  MITIGATED: ['RESOLVED'],
  RESOLVED: [], // Terminal state
};
```

#### 7. XSS Prevention
- **React escapes by default**
- **User input**: Stored as plain text, rendered safely
- **No `dangerouslySetInnerHTML`** used anywhere

### Feature Flag Evaluation Algorithm

#### Deterministic Hashing
Uses SHA-256 to ensure consistency:

```typescript
function hashUserIdForFlag(userId: string, flagKey: string): number {
  const hash = crypto
    .createHash('sha256')
    .update(`${userId}:${flagKey}`)
    .digest('hex');
  
  // Convert to number 0-99
  return parseInt(hash.substring(0, 8), 16) % 100;
}
```

**Properties**:
- Same user + flag → same result (deterministic)
- Different users → uniform distribution
- Changing flagKey → different distribution (for A/B testing)

#### Percentage Rollout
```typescript
const hash = hashUserIdForFlag(userId, flagKey);
```

If hash is 42 and percentage is 30 → disabled  
If hash is 15 and percentage is 30 → enabled

---

## Performance Considerations

### Database Queries
- **Indexes**: Added on frequently filtered columns
  ```prisma
  @@index([tenantId, status])
  @@index([tenantId, severity])
  ```
- **N+1 Prevention**: Using Prisma `include` to eager-load relations
- **Pagination**: Offset-based (10 items per page)

### Potential Bottlenecks
1. **Incident list**: Could be slow with 10,000+ incidents
   - **Solution**: Cursor-based pagination + virtual scrolling
2. **Timeline rendering**: All events loaded at once
   - **Solution**: Paginate timeline events
3. **Feature flag evaluation**: Re-evaluated on every page load
   - **Solution**: Cache evaluation results (Redis)

---

## Tradeoffs & Next Steps

### Current Limitations

#### 1. No Real-time Updates
**What's missing**: Timeline doesn't auto-refresh when others add notes

**Why skipped**: Time constraint (would add 1-2 hours)

**Implementation plan**:
- Add Server-Sent Events endpoint: `/api/incidents/[id]/subscribe`
- Broadcast timeline events after mutations
- Client subscribes on mount, appends events to UI
- Handle reconnection and backfill

#### 2. Basic Pagination
**What's missing**: Cursor-based pagination, infinite scroll

**Why skipped**: Offset pagination sufficient for MVP

**Implementation plan**:
```typescript
const incidents = await prisma.incident.findMany({
  where: { tenantId: tenant.id },
  take: 10,
  cursor: { id: lastId },
  orderBy: { createdAt: 'desc' }
});
```

#### 3. No File Uploads
**What's missing**: Actual file upload and storage

**Why skipped**: Database schema ready, but no S3/Cloudflare R2 integration

**Implementation plan**:
- Add upload endpoint with pre-signed URLs
- Store files in S3/R2 with tenant prefix: `{tenantId}/{incidentId}/{fileId}`
- Background job for antivirus scanning (ClamAV)
- Update `Attachment.scanStatus` after scan

#### 4. Limited Testing
**What's missing**: Integration tests, E2E tests

**Why skipped**: Time constraint

**Implementation plan**:
```typescript
// Integration test example
describe('Tenant Isolation', () => {
  it('should not allow cross-tenant data access', async () => {
    const acmeIncident = await createIncident('acme', {...});
    const result = await getIncident('techstart', acmeIncident.id);
    expect(result).toBeNull(); // Should not find it
  });
});
```

#### 5. No Saved Views
**What's missing**: Users can't save their favorite filter combinations

**Why skipped**: Core functionality more important

**Implementation plan**:
- Add `SavedView` model: `userId`, `tenantId`, `name`, `filters` (JSON)
- UI: "Save current filters" button
- Quick access dropdown in incident list header

#### 6. No Bulk Actions
**What's missing**: Can't assign/close multiple incidents at once

**Why skipped**: Time constraint

**Implementation plan**:
- Checkbox column in incident table
- "Select all" header checkbox
- Bulk action dropdown: "Assign to...", "Change status to..."
- Server Action processes array of incident IDs

#### 7. No Background Job Queue
**What's missing**: Async job processing (antivirus, notifications)

**Why skipped**: Time constraint

**Implementation plan**:
- Add `Job` model with status, payload, retries
- Worker process polls for pending jobs
- Implement retry logic with exponential backoff
- Use pg_notify for real-time job updates

### Production Readiness Checklist

#### Required before deploying:

- [ ] Add rate limiting (e.g., 100 requests/hour per IP)
- [ ] Implement proper error boundaries
- [ ] Add monitoring (Sentry for errors, Vercel Analytics for perf)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Add database backups (Neon automatic backups)
- [ ] Configure CORS properly
- [ ] Add health check endpoint `/api/health`
- [ ] Review and harden CSP headers
- [ ] Add request logging (pino or winston)
- [ ] Set up staging environment

#### Nice to have:

- [ ] Add email notifications (Resend or SendGrid)
- [ ] Implement webhook system for integrations
- [ ] Add export functionality (CSV, PDF reports)
- [ ] Build admin panel for platform management
- [ ] Add data retention policies
- [ ] Implement soft deletes with restoration
- [ ] Add user activity tracking
- [ ] Build analytics dashboard

---

## Deployment Guide

### Option 1: Vercel + Neon (Recommended)

1. **Database**: Create Neon project
   ```bash
   # Get connection string from Neon dashboard
   DATABASE_URL="postgresql://..."
   ```

2. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

3. **Environment Variables** (in Vercel dashboard):
   - `DATABASE_URL`
   - `AUTH_SECRET` (generate: `openssl rand -base64 32`)
   - `AUTH_URL` (your-app.vercel.app)

4. **Run Migrations**:
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Option 2: Docker Compose (Full Stack)

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/ops_platform
    depends_on:
      - db
  
  db:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Option 3: Railway

1. Create Railway project
2. Add PostgreSQL plugin
3. Connect GitHub repo
4. Set environment variables
5. Deploy automatically on push

---

## Contributing

This is a take-home assessment project. Not accepting contributions, but feel free to fork and learn!

---

## License

MIT

---

## Author: Samson Kinyanjui

Built as a take-home assessment demonstrating:
- Next.js App Router proficiency
- Multi-tenant architecture design
- Database schema design
- Security best practices
- Clean code and documentation

**GitHub**: https://github.com/sammainahkinya1404/ops-platform