import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { validateTenantAccess } from '@/lib/tenant';
import { createIncident } from './actions';
import Link from 'next/link';

export default async function NewIncidentPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const session = await auth();
  const { tenantSlug } = await params;

  if (!session?.user) {
    redirect('/auth/signin');
  }

  await validateTenantAccess(session.user.id, tenantSlug);

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Incident</h1>

      <form action={createIncident} className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-6">
        <input type="hidden" name="tenantSlug" value={tenantSlug} />

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., High memory usage on payment service"
          />
        </div>

        {/* Severity */}
        <div>
          <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
            Severity *
          </label>
          <select
            id="severity"
            name="severity"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="SEV1">SEV1 - Critical</option>
            <option value="SEV2">SEV2 - High</option>
            <option value="SEV3">SEV3 - Medium</option>
            <option value="SEV4">SEV4 - Low</option>
          </select>
        </div>

        {/* Service */}
        <div>
          <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
            Service *
          </label>
          <input
            type="text"
            id="service"
            name="service"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., api-gateway, payment-service"
          />
        </div>

        {/* Environment */}
        <div>
          <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-2">
            Environment *
          </label>
          <select
            id="environment"
            name="environment"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PROD">Production</option>
            <option value="STAGING">Staging</option>
            <option value="DEV">Development</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., urgent, performance, security"
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Create Incident
          </button>
          <Link
            href={`/t/${tenantSlug}/incidents`}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
