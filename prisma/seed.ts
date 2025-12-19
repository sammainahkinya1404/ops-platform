import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Hash password for all users
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create Tenants
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Acme Corporation',
      slug: 'acme',
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'TechStart Inc',
      slug: 'techstart',
    },
  });

  console.log('✅ Created tenants');

  // Create Users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Admin',
      passwordHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob Engineer',
      passwordHash,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      name: 'Charlie Viewer',
      passwordHash,
    },
  });

  console.log('✅ Created users');

  // Create Memberships (cross-tenant)
  await prisma.membership.createMany({
    data: [
      // Alice is admin in both tenants
      { userId: alice.id, tenantId: tenant1.id, role: 'ADMIN' },
      { userId: alice.id, tenantId: tenant2.id, role: 'ADMIN' },
      // Bob is engineer in both
      { userId: bob.id, tenantId: tenant1.id, role: 'ENGINEER' },
      { userId: bob.id, tenantId: tenant2.id, role: 'ENGINEER' },
      // Charlie is viewer in tenant1 only
      { userId: charlie.id, tenantId: tenant1.id, role: 'VIEWER' },
    ],
  });

  console.log('✅ Created memberships');

  // Create Incidents for Tenant 1 (Acme)
  const services = ['api-gateway', 'auth-service', 'payment-service', 'database', 'frontend'];
  const environments = ['DEV', 'STAGING', 'PROD'];
  const severities = ['SEV1', 'SEV2', 'SEV3', 'SEV4'];
  const statuses = ['OPEN', 'MITIGATED', 'RESOLVED'];

  const incidentTitles = [
    'High memory usage on payment service',
    'API gateway returning 502 errors',
    'Database connection pool exhausted',
    'Authentication service slow response',
    'Frontend assets failing to load',
    'CPU spike on auth service',
    'Disk space running low',
    'Redis cache connection timeout',
    'Email delivery delays',
    'Search indexing job failing',
  ];

  const tags = ['urgent', 'performance', 'security', 'network', 'infrastructure'];

  // Create 25 incidents for tenant1
  for (let i = 0; i < 25; i++) {
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const service = services[Math.floor(Math.random() * services.length)];
    const environment = environments[Math.floor(Math.random() * environments.length)];
    const title = incidentTitles[i % incidentTitles.length];
    const incidentTags = [tags[Math.floor(Math.random() * tags.length)]];

    const incident = await prisma.incident.create({
      data: {
        title: `${title} #${i + 1}`,
        severity: severity as any,
        status: status as any,
        service,
        environment: environment as any,
        tags: incidentTags,
        createdById: alice.id,
        assigneeId: Math.random() > 0.5 ? bob.id : null,
        tenantId: tenant1.id,
      },
    });

    // Add timeline events
    await prisma.timelineEvent.create({
      data: {
        incidentId: incident.id,
        userId: alice.id,
        type: 'NOTE',
        content: 'Initial investigation started',
      },
    });

    if (status !== 'OPEN') {
      await prisma.timelineEvent.create({
        data: {
          incidentId: incident.id,
          userId: bob.id,
          type: 'STATUS_CHANGE',
          content: `Status changed from OPEN to ${status}`,
          metadata: { from: 'OPEN', to: status },
        },
      });
    }
  }

  console.log('✅ Created 25 incidents for Acme');

  // Create 20 incidents for tenant2
  for (let i = 0; i < 20; i++) {
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const service = services[Math.floor(Math.random() * services.length)];
    const environment = environments[Math.floor(Math.random() * environments.length)];
    const title = incidentTitles[i % incidentTitles.length];
    const incidentTags = [tags[Math.floor(Math.random() * tags.length)]];

    const incident = await prisma.incident.create({
      data: {
        title: `${title} #${i + 1}`,
        severity: severity as any,
        status: status as any,
        service,
        environment: environment as any,
        tags: incidentTags,
        createdById: alice.id,
        assigneeId: Math.random() > 0.5 ? bob.id : null,
        tenantId: tenant2.id,
      },
    });

    await prisma.timelineEvent.create({
      data: {
        incidentId: incident.id,
        userId: alice.id,
        type: 'NOTE',
        content: 'Incident reported and under investigation',
      },
    });
  }

  console.log('✅ Created 20 incidents for TechStart');

  // Create Feature Flags for both tenants
  const flagKeys = [
    'new-dashboard',
    'advanced-analytics',
    'dark-mode',
    'ai-recommendations',
    'real-time-alerts',
  ];

  for (const tenant of [tenant1, tenant2]) {
    for (const env of environments) {
      for (const key of flagKeys) {
        await prisma.featureFlag.create({
          data: {
            key,
            tenantId: tenant.id,
            environment: env as any,
            enabled: Math.random() > 0.5,
            rules: {
              type: 'percentage',
              value: Math.floor(Math.random() * 100),
            },
          },
        });
      }
    }
  }

  console.log('✅ Created feature flags');

  console.log('🎉 Seed completed!');
  console.log('\n📊 Summary:');
  console.log('- 2 Tenants: Acme, TechStart');
  console.log('- 3 Users: alice@example.com, bob@example.com, charlie@example.com');
  console.log('- Password for all: password123');
  console.log('- 45 Incidents total');
  console.log('- 30 Feature flags');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });