import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { validateTenantAccess } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { evaluateFeatureFlag } from '@/lib/feature-flags';
import Link from 'next/link';

export default async function EvaluateToolPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{
    flagId?: string;
    userId?: string;
    environment?: string;
    service?: string;
  }>;
}) {
  const session = await auth();
  const { tenantSlug } = await params;
  const filters = await searchParams;

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const { tenant } = await validateTenantAccess(session.user.id, tenantSlug);

  // Get all flags for this tenant
  const flags = await prisma.featureFlag.findMany({
    where: { tenantId: tenant.id },
    orderBy: { key: 'asc' },
  });

  // Get all users in this tenant for the dropdown
  const users = await prisma.membership.findMany({
    where: { tenantId: tenant.id },
    include: { user: true },
  });

  let evaluationResult = null;

  // If filters are provided, evaluate
  if (filters.flagId && filters.userId && filters.environment) {
    const flag = await prisma.featureFlag.findFirst({
      where: {
        id: filters.flagId,
        tenantId: tenant.id,
      },
    });

    if (flag) {
      evaluationResult = evaluateFeatureFlag(
        flag.key,
        flag.enabled,
        flag.rules as any,
        {
          userId: filters.userId,
          environment: filters.environment,
          service: filters.service,
        }
      );
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/t/${tenantSlug}/flags`}
          className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
        >
          ← Back to Feature Flags
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Feature Flag Evaluation Tool
        </h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Evaluation</h2>
        <form method="get" className="space-y-4">
          {/* Flag Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Flag
            </label>
            <select
              name="flagId"
              required
              defaultValue={filters.flagId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a flag...</option>
              {flags.map((flag) => (
                <option key={flag.id} value={flag.id}>
                  {flag.key} ({flag.environment})
                </option>
              ))}
            </select>
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <select
              name="userId"
              required
              defaultValue={filters.userId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a user...</option>
              {users.map((membership) => (
                <option key={membership.userId} value={membership.userId}>
                  {membership.user.name} ({membership.user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Environment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Environment
            </label>
            <select
              name="environment"
              required
              defaultValue={filters.environment || 'PROD'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DEV">Development</option>
              <option value="STAGING">Staging</option>
              <option value="PROD">Production</option>
            </select>
          </div>

          {/* Service (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service (Optional)
            </label>
            <input
              type="text"
              name="service"
              defaultValue={filters.service}
              placeholder="e.g., api-gateway"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Evaluate
          </button>
        </form>
      </div>

      {/* Evaluation Result */}
      {evaluationResult && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Evaluation Result</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  evaluationResult.enabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {evaluationResult.enabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Reason:</span>
              <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                {evaluationResult.reason}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
