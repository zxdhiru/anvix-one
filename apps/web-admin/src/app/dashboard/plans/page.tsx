'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api, type Plan, type CreatePlanInput } from '@/lib/api';

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      setLoading(true);
      setError('');
      const data = await api.getPlans();
      setPlans(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(plan: Plan) {
    if (!confirm(`Deactivate plan "${plan.name}"? This will soft-delete the plan.`)) return;

    try {
      await api.deletePlan(plan.id);
      await loadPlans();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  function handleEdit(plan: Plan) {
    setEditingPlan(plan);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingPlan(null);
    loadPlans();
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
          <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
          <p className="text-gray-500 mt-1">{plans.length} subscription plans</p>
        </div>
        <button
          onClick={() => {
            setEditingPlan(null);
            setShowForm(true);
          }}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Plan
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl">
          <p>{error}</p>
          <button onClick={loadPlans} className="mt-2 text-sm underline">
            Retry
          </button>
        </div>
      )}

      {showForm && <PlanForm plan={editingPlan} onClose={handleFormClose} />}

      {plans.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">No plans created yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Create your first subscription plan to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}) {
  return (
    <div
      className={`bg-white rounded-xl border p-6 ${
        plan.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{plan.name}</h3>
          {!plan.isActive && <span className="text-xs text-red-500 font-medium">Inactive</span>}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(plan)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(plan)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Deactivate"
          >
            🗑️
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-2">{plan.description || 'No description'}</p>

      <div className="mt-4">
        <span className="text-2xl font-bold text-gray-900">
          ₹{(plan.priceInPaise / 100).toLocaleString('en-IN')}
        </span>
        <span className="text-gray-500 text-sm">/{plan.billingCycle}</span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Max Students</span>
          <span className="font-medium">{plan.maxStudents.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>SMS Quota</span>
          <span className="font-medium">{plan.smsQuota.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Sort Order</span>
          <span className="font-medium">{plan.sortOrder}</span>
        </div>
      </div>
    </div>
  );
}

function PlanForm({ plan, onClose }: { plan: Plan | null; onClose: () => void }) {
  const isEditing = !!plan;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [priceInPaise, setPriceInPaise] = useState(plan ? plan.priceInPaise / 100 : 500);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>(
    (plan?.billingCycle as 'monthly' | 'quarterly' | 'yearly') ?? 'monthly',
  );
  const [maxStudents, setMaxStudents] = useState(plan?.maxStudents ?? 100);
  const [smsQuota, setSmsQuota] = useState(plan?.smsQuota ?? 0);
  const [features, setFeatures] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data: CreatePlanInput = {
      name,
      description: description || undefined,
      priceInPaise: Math.round(priceInPaise * 100),
      billingCycle,
      maxStudents,
      smsQuota,
      features: features
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean),
    };

    try {
      if (isEditing) {
        await api.updatePlan(plan.id, data);
      } else {
        await api.createPlan(data);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-blue-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Plan' : 'Create New Plan'}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., Basic, Standard, Premium"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
            <select
              value={billingCycle}
              onChange={(e) =>
                setBillingCycle(e.target.value as 'monthly' | 'quarterly' | 'yearly')
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number"
              required
              min={0}
              step={1}
              value={priceInPaise}
              onChange={(e) => setPriceInPaise(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
            <input
              type="number"
              required
              min={1}
              value={maxStudents}
              onChange={(e) => setMaxStudents(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMS Quota</label>
            <input
              type="number"
              min={0}
              value={smsQuota}
              onChange={(e) => setSmsQuota(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Features (comma-separated)
            </label>
            <input
              type="text"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., attendance, fees, exams"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Brief plan description"
          />
        </div>

        {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
