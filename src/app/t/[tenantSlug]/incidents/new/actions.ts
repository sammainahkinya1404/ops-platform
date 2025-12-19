'use server';

import { auth } from '@/lib/auth';
import { validateTenantAccess } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createIncident(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const tenantSlug = formData.get('tenantSlug') as string;
  const { tenant } = await validateTenantAccess(session.user.id, tenantSlug);

  const title = formData.get('title') as string;
  const severity = formData.get('severity') as string;
  const service = formData.get('service') as string;
  const environment = formData.get('environment') as string;
  const tagsString = formData.get('tags') as string;

  const tags = tagsString
    ? tagsString.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  // Create incident
  const incident = await prisma.incident.create({
    data: {
      title,
      severity: severity as any,
      service,
      environment: environment as any,
      tags,
      status: 'OPEN',
      tenantId: tenant.id,
      createdById: session.user.id,
    },
  });

  // Create initial timeline event
  await prisma.timelineEvent.create({
    data: {
      incidentId: incident.id,
      userId: session.user.id,
      type: 'NOTE',
      content: 'Incident created',
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.user.id,
      action: 'CREATE',
      resource: `incident:${incident.id}`,
      after: { title, severity, service, environment },
    },
  });

  // Revalidate the incidents list page
  revalidatePath(`/t/${tenantSlug}/incidents`);

  // Redirect to the incident detail page
  redirect(`/t/${tenantSlug}/incidents/${incident.id}`);
}
