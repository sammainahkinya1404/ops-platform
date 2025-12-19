import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { validateTenantAccess } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { addNote, changeStatus } from './actions';
import Link from 'next/link';

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; incidentId: string }>;
}) {
  const session = await auth();
  const { tenantSlug, incidentId } = await params;

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const { tenant } = await validateTenantAccess(session.user.id, tenantSlug);

  // Fetch incident with all relations
  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      tenantId: tenant.id, // Tenant isolation!
    },
    include: {
      createdBy: true,
      assignee: true,
      timeline: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!incident) {
    notFound();
  }

  const getSeverityColor = (severity: string) => {
    const colors = {
      SEV1: 'bg-red-100 text-red-800 border-red-300',
      SEV2: 'bg-orange-100 text-orange-800 border-orange-300',
      SEV3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      SEV4: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[severity as keyof typeof colors];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      OPEN: 'bg-red-100 text-red-800 border-red-300',
      MITIGATED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      RESOLVED: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[status as keyof typeof colors];
  };

  // Determine valid next statuses based on current status
  const getValidNextStatuses = (currentStatus: string) => {
    if (currentStatus === 'OPEN') return ['MITIGATED', 'RESOLVED'];
    if (currentStatus === 'MITIGATED') return ['RESOLVED'];
    return [];
  };

  const validNextStatuses = getValidNextStatuses(incident.status);

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/t/${tenantSlug}/incidents`}
          className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
        >
          ← Back to Incidents
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{incident.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Details Card */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Severity</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getSeverityColor(
                      incident.severity
                    )}`}
                  >
                    {incident.severity}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(
                      incident.status
                    )}`}
                  >
                    {incident.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Service</dt>
                <dd className="mt-1 text-sm text-gray-900">{incident.service}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Environment</dt>
                <dd className="mt-1">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                    {incident.environment}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="mt-1 text-sm text-gray-900">{incident.createdBy.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Assignee</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {incident.assignee?.name || 'Unassigned'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(incident.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Updated At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(incident.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
            {incident.tags.length > 0 && (
              <div className="mt-4">
                <dt className="text-sm font-medium text-gray-500 mb-2">Tags</dt>
                <div className="flex flex-wrap gap-2">
                  {incident.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Timeline</h2>
            <div className="space-y-4">
              {incident.timeline.map((event, index) => (
                <div key={event.id} className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div className={`w-3 h-3 rounded-full ${
                      event.type === 'STATUS_CHANGE' ? 'bg-green-500' :
                      event.type === 'ACTION' ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    {index < incident.timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-300 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {event.user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">{event.content}</div>
                    {event.type === 'STATUS_CHANGE' && (
                      <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded bg-green-50 text-green-700">
                        Status Change
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Change Status */}
          {validNextStatuses.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Change Status</h3>
              <form action={changeStatus} className="space-y-3">
                <input type="hidden" name="tenantSlug" value={tenantSlug} />
                <input type="hidden" name="incidentId" value={incidentId} />
                {validNextStatuses.map((status) => (
                  <button
                    key={status}
                    type="submit"
                    name="newStatus"
                    value={status}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
                  >
                    Mark as {status}
                  </button>
                ))}
              </form>
            </div>
          )}

          {/* Add Note */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Add Note</h3>
            <form action={addNote} className="space-y-3">
              <input type="hidden" name="tenantSlug" value={tenantSlug} />
              <input type="hidden" name="incidentId" value={incidentId} />
              <textarea
                name="content"
                required
                rows={4}
                placeholder="Add your note here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 font-medium text-sm"
              >
                Add Note
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
