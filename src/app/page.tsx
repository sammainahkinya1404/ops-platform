import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserTenants } from '@/lib/tenant';
import Link from 'next/link';

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const tenants = await getUserTenants(session.user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome, {session.user.name}!
          </h1>
          <p className="text-lg text-gray-600">
            Select an organization to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {tenants.map((tenant) => (
            <Link
              key={tenant.id}
              href={`/t/${tenant.slug}`}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {tenant.name}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                /{tenant.slug}
              </p>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {tenant.role}
                </span>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="/api/auth/signout"
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Sign out
          </a>
        </div>
      </div>
    </div>
  );
}
