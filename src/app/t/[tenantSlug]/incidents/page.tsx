import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { validateTenantAccess } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

interface SearchParams {
  status?: string;
  severity?: string;
  environment?: string;
  search?: string;
  page?: string;
}

const ITEMS_PER_PAGE = 10;

export default async function IncidentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  const { tenantSlug } = await params;
  const filters = await searchParams;

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const { tenant } = await validateTenantAccess(session.user.id, tenantSlug);

  // Build query filters
  const where: any = { tenantId: tenant.id };

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.severity) {
    where.severity = filters.severity;
  }
  if (filters.environment) {
    where.environment = filters.environment;
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { service: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const page = parseInt(filters.page || '1');
  const skip = (page - 1) * ITEMS_PER_PAGE;

  // Fetch incidents with pagination
  const [incidents, totalCount] = await Promise.all([
    prisma.incident.findMany({
      where,
      include: {
        createdBy: true,
        assignee: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.incident.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Helper function to build filter URLs
  const buildFilterUrl = (key: string, value: string) => {
    const params = new URLSearchParams(filters as any);
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
      params.delete('page'); // Reset to page 1 when filtering
    }
    return `?${params.toString()}`;
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      SEV1: 'bg-red-100 text-red-800',
      SEV2: 'bg-orange-100 text-orange-800',
      SEV3: 'bg-yellow-100 text-yellow-800',
      SEV4: 'bg-blue-100 text-blue-800',
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      OPEN: 'bg-red-100 text-red-800',
      MITIGATED: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Incidents</h1>
        <Link
          href={`/t/${tenantSlug}/incidents/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Create Incident
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-4">
            <form action="">
              <input
                type="text"
                name="search"
                defaultValue={filters.search}
                placeholder="Search by title or service..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </form>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="space-y-1">
              {['OPEN', 'MITIGATED', 'RESOLVED'].map((status) => (
                <Link
                  key={status}
                  href={buildFilterUrl('status', status)}
                  className={`block px-3 py-2 rounded text-sm ${
                    filters.status === status
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {status}
                </Link>
              ))}
            </div>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity
            </label>
            <div className="space-y-1">
              {['SEV1', 'SEV2', 'SEV3', 'SEV4'].map((severity) => (
                <Link
                  key={severity}
                  href={buildFilterUrl('severity', severity)}
                  className={`block px-3 py-2 rounded text-sm ${
                    filters.severity === severity
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {severity}
                </Link>
              ))}
            </div>
          </div>

          {/* Environment Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Environment
            </label>
            <div className="space-y-1">
              {['DEV', 'STAGING', 'PROD'].map((env) => (
                <Link
                  key={env}
                  href={buildFilterUrl('environment', env)}
                  className={`block px-3 py-2 rounded text-sm ${
                    filters.environment === env
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {env}
                </Link>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <Link
              href={`/t/${tenantSlug}/incidents`}
              className="w-full px-3 py-2 text-center border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              Clear Filters
            </Link>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {incidents.length} of {totalCount} incidents
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Environment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/t/${tenantSlug}/incidents/${incident.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {incident.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(
                        incident.severity
                      )}`}
                    >
                      {incident.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        incident.status
                      )}`}
                    >
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {incident.service}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {incident.environment}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {incident.assignee?.name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(incident.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?${new URLSearchParams({ ...filters, page: p.toString() } as any).toString()}`}
              className={`px-4 py-2 rounded-md ${
                p === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
