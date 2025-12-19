import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { validateTenantAccess } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function TenantDashboard({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const session = await auth();
  const { tenantSlug } = await params;

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const { tenant } = await validateTenantAccess(session.user.id, tenantSlug);

  // Get incident statistics
  const [totalIncidents, openIncidents, sev1Incidents] = await Promise.all([
    prisma.incident.count({ where: { tenantId: tenant.id } }),
    prisma.incident.count({
      where: { tenantId: tenant.id, status: 'OPEN' },
    }),
    prisma.incident.count({
      where: { tenantId: tenant.id, severity: 'SEV1', status: 'OPEN' },
    }),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Total Incidents</p>
          <p className="text-4xl font-bold text-gray-900">{totalIncidents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Open Incidents</p>
          <p className="text-4xl font-bold text-orange-600">{openIncidents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Critical (SEV1)</p>
          <p className="text-4xl font-bold text-red-600">{sev1Incidents}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="space-y-3">
          <Link
            href={`/t/${tenantSlug}/incidents`}
            className="block px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-md text-blue-700 font-medium transition-colors"
          >
            View All Incidents →
          </Link>
          <Link
            href={`/t/${tenantSlug}/flags`}
            className="block px-4 py-3 bg-green-50 hover:bg-green-100 rounded-md text-green-700 font-medium transition-colors"
          >
            Manage Feature Flags →
          </Link>
        </div>
      </div>
    </div>
  );
}
