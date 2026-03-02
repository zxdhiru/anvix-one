'use client';

import { useEffect, useState } from 'react';
import { api, type Tenant } from '@/lib/api';
import { StatusBadge } from '../page';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    try {
      setLoading(true);
      setError('');
      const data = await api.getTenants();
      setTenants(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(tenantId: string, newStatus: string, reason?: string) {
    if (!confirm(`Are you sure you want to ${newStatus} this tenant?`)) return;

    try {
      setActionLoading(tenantId);
      await api.updateTenantStatus(tenantId, newStatus, reason);
      await loadTenants();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleProvision(tenantId: string) {
    if (!confirm('Provision this tenant? This will create their database schema and admin user.'))
      return;

    try {
      setActionLoading(tenantId);
      await api.provisionTenant(tenantId);
      await loadTenants();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Provisioning failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(tenantId: string, tenantName: string) {
    const confirmation = prompt(
      `Type "${tenantName}" to permanently delete this tenant and all their data:`,
    );
    if (confirmation !== tenantName) return;

    try {
      setActionLoading(tenantId);
      await api.deleteTenant(tenantId);
      await loadTenants();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Deletion failed');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-32" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 mt-1">{tenants.length} registered schools</p>
        </div>
        <button
          onClick={loadTenants}
          className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl">
          <p>{error}</p>
          <button onClick={loadTenants} className="mt-2 text-sm underline">
            Retry
          </button>
        </div>
      )}

      {tenants.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">No tenants registered yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Tenants will appear here once schools sign up.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">School</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Board</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Schema</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{tenant.name}</div>
                      <div className="text-sm text-gray-500">{tenant.subdomain}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-gray-900">{tenant.principalName}</div>
                      <div className="text-gray-500">{tenant.principalPhone}</div>
                      <div className="text-gray-500">{tenant.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 uppercase">{tenant.board}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tenant.subscriptionStatus} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {tenant.schemaName ? (
                      <span className="text-green-600 font-mono text-xs">{tenant.schemaName}</span>
                    ) : (
                      <span className="text-gray-400">Not provisioned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(tenant.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <TenantActions
                      tenant={tenant}
                      loading={actionLoading === tenant.id}
                      onStatusChange={handleStatusChange}
                      onProvision={handleProvision}
                      onDelete={handleDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TenantActions({
  tenant,
  loading,
  onStatusChange,
  onProvision,
  onDelete,
}: {
  tenant: Tenant;
  loading: boolean;
  onStatusChange: (id: string, status: string, reason?: string) => void;
  onProvision: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}) {
  if (loading) {
    return <span className="text-sm text-gray-400">Processing...</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {/* Provision button for pending tenants without schema */}
      {!tenant.schemaName && tenant.subscriptionStatus === 'pending' && (
        <ActionButton onClick={() => onProvision(tenant.id)} color="blue">
          Provision
        </ActionButton>
      )}

      {/* Suspend active tenants */}
      {tenant.subscriptionStatus === 'active' && (
        <ActionButton
          onClick={() => onStatusChange(tenant.id, 'suspended', 'Suspended by admin')}
          color="yellow"
        >
          Suspend
        </ActionButton>
      )}

      {/* Reactivate suspended tenants */}
      {tenant.subscriptionStatus === 'suspended' && (
        <ActionButton
          onClick={() => onStatusChange(tenant.id, 'active', 'Reactivated by admin')}
          color="green"
        >
          Reactivate
        </ActionButton>
      )}

      {/* Cancel subscription */}
      {['active', 'suspended', 'past_due'].includes(tenant.subscriptionStatus) && (
        <ActionButton
          onClick={() => onStatusChange(tenant.id, 'cancelled', 'Cancelled by admin')}
          color="orange"
        >
          Cancel
        </ActionButton>
      )}

      {/* Delete tenant */}
      <ActionButton onClick={() => onDelete(tenant.id, tenant.name)} color="red">
        Delete
      </ActionButton>
    </div>
  );
}

function ActionButton({
  onClick,
  color,
  children,
}: {
  onClick: () => void;
  color: 'blue' | 'green' | 'yellow' | 'orange' | 'red';
  children: React.ReactNode;
}) {
  const colorStyles: Record<string, string> = {
    blue: 'text-blue-600 hover:bg-blue-50 border-blue-200',
    green: 'text-green-600 hover:bg-green-50 border-green-200',
    yellow: 'text-yellow-600 hover:bg-yellow-50 border-yellow-200',
    orange: 'text-orange-600 hover:bg-orange-50 border-orange-200',
    red: 'text-red-600 hover:bg-red-50 border-red-200',
  };

  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs font-medium border rounded transition-colors ${colorStyles[color]}`}
    >
      {children}
    </button>
  );
}
