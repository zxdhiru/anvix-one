'use client';

import { useEffect, useState } from 'react';
import { api, type Tenant, type Plan } from '@/lib/api';

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  pendingTenants: number;
  cancelledTenants: number;
  totalPlans: number;
  activePlans: number;
  mrr: number; // Monthly Recurring Revenue in paise
}

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [tenantList, planList] = await Promise.all([api.getTenants(), api.getPlans()]);

      // Calculate stats
      const activeTenants = tenantList.filter((t) => t.subscriptionStatus === 'active');
      const mrr = calculateMRR(activeTenants, planList);

      setStats({
        totalTenants: tenantList.length,
        activeTenants: activeTenants.length,
        suspendedTenants: tenantList.filter((t) => t.subscriptionStatus === 'suspended').length,
        pendingTenants: tenantList.filter((t) => t.subscriptionStatus === 'pending').length,
        cancelledTenants: tenantList.filter((t) => t.subscriptionStatus === 'cancelled').length,
        totalPlans: planList.length,
        activePlans: planList.filter((p) => p.isActive).length,
        mrr,
      });

      // Show 5 most recent tenants
      setRecentTenants(
        [...tenantList]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  function calculateMRR(_activeTenants: Tenant[], _plans: Plan[]): number {
    // Simple MRR estimate: count active tenants × average plan price
    // In production, this would join with subscription data
    if (_activeTenants.length === 0 || _plans.length === 0) return 0;
    const avgPrice = _plans.reduce((sum, p) => sum + p.priceInPaise, 0) / _plans.length;
    return Math.round(_activeTenants.length * avgPrice);
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-xl">
        <p className="font-medium">Error loading dashboard</p>
        <p className="text-sm mt-1">{error}</p>
        <button onClick={loadDashboard} className="mt-3 text-sm underline hover:no-underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and key metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tenants"
          value={stats?.totalTenants ?? 0}
          subtitle={`${stats?.activeTenants ?? 0} active`}
          color="blue"
        />
        <StatCard
          title="MRR"
          value={formatCurrency(stats?.mrr ?? 0)}
          subtitle="Monthly Recurring Revenue"
          color="green"
        />
        <StatCard
          title="Active"
          value={stats?.activeTenants ?? 0}
          subtitle={`${stats?.pendingTenants ?? 0} pending`}
          color="emerald"
        />
        <StatCard
          title="Issues"
          value={(stats?.suspendedTenants ?? 0) + (stats?.cancelledTenants ?? 0)}
          subtitle={`${stats?.suspendedTenants ?? 0} suspended, ${stats?.cancelledTenants ?? 0} cancelled`}
          color="red"
        />
      </div>

      {/* Recent Tenants */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Tenants</h2>
          <a href="/dashboard/tenants" className="text-sm text-blue-600 hover:text-blue-700">
            View all →
          </a>
        </div>
        {recentTenants.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">No tenants registered yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">School</th>
                <th className="px-6 py-3">Board</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{tenant.name}</div>
                      <div className="text-sm text-gray-500">{tenant.subdomain}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 uppercase">{tenant.board}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tenant.subscriptionStatus} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(tenant.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  color: 'blue' | 'green' | 'emerald' | 'red';
}) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    red: 'bg-red-50 border-red-200',
  };

  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    past_due: 'bg-orange-100 text-orange-800',
    trial: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[status] ?? 'bg-gray-100 text-gray-800'
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
