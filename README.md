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

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Start the Database

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

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:1234@localhost:5432/ops_platform"
AUTH_SECRET="your-super-secret-key-change-this-in-production"
AUTH_URL="http://localhost:3000"
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run Database Migrations

```bash
npx prisma migrate dev
```

### 6. Seed the Database

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

### 7. Start the Development Server

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
