'use server';

import { auth } from '@/lib/auth';
import { validateTenantAccess } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addNote(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const tenantSlug = formData.get('tenantSlug') as string;
  const incidentId = formData.get('incidentId') as string;
  const content = formData.get('content') as string;

  const { tenant } = await validateTenantAccess(session.user.id, tenantSlug);

  // Verify incident belongs to tenant
  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      tenantId: tenant.id,
    },
  });

  if (!incident) {
    throw new Error('Incident not found');
  }

  // Create timeline event
  await prisma.timelineEvent.create({
    data: {
      incidentId,
      userId: session.user.id,
      type: 'NOTE',
      content,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.user.id,
      action: 'UPDATE',
      resource: `incident:${incidentId}`,
      after: { note: content },
    },
  });

  revalidatePath(`/t/${tenantSlug}/incidents/${incidentId}`);
}

export async function changeStatus(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const tenantSlug = formData.get('tenantSlug') as string;
  const incidentId = formData.get('incidentId') as string;
  const newStatus = formData.get('newStatus') as string;

  const { tenant } = await validateTenantAccess(session.user.id, tenantSlug);

  // Verify incident belongs to tenant
  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      tenantId: tenant.id,
    },
  });

  if (!incident) {
    throw new Error('Incident not found');
  }

  // Validate status transition
  const validTransitions: Record<string, string[]> = {
    OPEN: ['MITIGATED', 'RESOLVED'],
    MITIGATED: ['RESOLVED'],
    RESOLVED: [], // Cannot transition from RESOLVED
  };

  if (!validTransitions[incident.status]?.includes(newStatus)) {
    throw new Error('Invalid status transition');
  }

  // Update incident status in a transaction
  await prisma.$transaction([
    prisma.incident.update({
      where: { id: incidentId },
      data: { status: newStatus as any },
    }),
    prisma.timelineEvent.create({
      data: {
        incidentId,
        userId: session.user.id,
        type: 'STATUS_CHANGE',
        content: `Status changed from ${incident.status} to ${newStatus}`,
        metadata: {
          from: incident.status,
          to: newStatus,
        },
      },
    }),
    prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: session.user.id,
        action: 'UPDATE',
        resource: `incident:${incidentId}`,
        before: { status: incident.status },
        after: { status: newStatus },
      },
    }),
  ]);

  revalidatePath(`/t/${tenantSlug}/incidents/${incidentId}`);
}
