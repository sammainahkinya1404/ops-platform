import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { validateTenantAccess } from '@/lib/tenant';
import Link from 'next/link';

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const session = await auth();
  const { tenantSlug } = await params;

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const { tenant, role } = await validateTenantAccess(
    session.user.id,
    tenantSlug
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                href="/"
                className="flex items-center px-2 text-gray-500 hover:text-gray-900"
              >
                ← Back to Tenants
              </Link>
              <div className="flex items-center px-4">
                <span className="text-xl font-bold text-gray-900">
                  {tenant.name}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({role})
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/t/${tenantSlug}/incidents`}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Incidents
              </Link>
              <Link
                href={`/t/${tenantSlug}/flags`}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Feature Flags
              </Link>
              <span className="text-sm text-gray-600">
                {session.user.name}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
