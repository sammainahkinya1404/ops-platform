import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { validateTenantAccess } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function FeatureFlagsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ environment?: string }>;
}) {
  const session = await auth();
  const { tenantSlug } = await params;
  const { environment } = await searchParams;

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const { tenant } = await validateTenantAccess(session.user.id, tenantSlug);

  const selectedEnv = environment || 'PROD';

  // Fetch flags for selected environment
  const flags = await prisma.featureFlag.findMany({
    where: {
      tenantId: tenant.id,
      environment: selectedEnv as any,
    },
    orderBy: {
      key: 'asc',
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
        <Link
          href={`/t/${tenantSlug}/flags/new`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Create Flag
        </Link>
      </div>

      {/* Environment Selector */}
      <div className="mb-6 flex space-x-2">
        {['DEV', 'STAGING', 'PROD'].map((env) => (
          <Link
            key={env}
            href={`/t/${tenantSlug}/flags?environment=${env}`}
            className={`px-4 py-2 rounded-md font-medium ${
              selectedEnv === env
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {env}
          </Link>
        ))}
      </div>

      {/* Flags List */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Flag Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rules
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {flags.map((flag) => (
              <tr key={flag.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm text-gray-900">
                  {flag.key}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      flag.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {JSON.stringify(flag.rules)}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/t/${tenantSlug}/flags/${flag.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View/Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Evaluation Tool Link */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Test Flag Evaluation
        </h3>
        <p className="text-sm text-blue-800 mb-3">
          Use the evaluation tool to test how flags would be evaluated for different users and conditions.
        </p>
        <Link
          href={`/t/${tenantSlug}/flags/evaluate`}
          className="inline-flex px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
        >
          Open Evaluation Tool →
        </Link>
      </div>
    </div>
  );
}
