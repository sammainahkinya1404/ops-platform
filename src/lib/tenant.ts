import { prisma } from './prisma';
import { auth } from './auth';

export async function getUserTenants(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { tenant: true },
  });

  return memberships.map((m) => ({
    ...m.tenant,
    role: m.role,
  }));
}

export async function validateTenantAccess(userId: string, tenantSlug: string) {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      tenant: { slug: tenantSlug },
    },
    include: { tenant: true },
  });

  if (!membership) {
    throw new Error('Access denied to this tenant');
  }

  return {
    tenant: membership.tenant,
    role: membership.role,
  };
}

export async function getTenantFromSlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
  });
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.user.id },
  });
}
