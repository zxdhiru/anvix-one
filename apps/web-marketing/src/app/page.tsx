'use client';

import { useEffect, useState, type FormEvent } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceInPaise: number;
  billingCycle: string;
  maxStudents: number;
  smsQuota: number;
  isActive: boolean;
}

// =========================================
// Landing Page
// =========================================
export default function HomePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/platform/plans?activeOnly=true`)
      .then((r) => r.json())
      .then((data) => setPlans(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function handleSelectPlan(plan: Plan) {
    setSelectedPlan(plan);
    setShowRegister(true);
    setTimeout(() => {
      document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight">Anvix One</span>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <a
              href="http://localhost:3002/en/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              School Login
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            School Management
            <br />
            <span className="text-blue-600">Made Simple</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            Complete school management platform for Indian schools. Manage students, teachers,
            attendance, fees, exams — all in one place.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="#pricing"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Plans &amp; Register
            </a>
            <a
              href="#features"
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              See Features
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">Everything Your School Needs</h2>
          <p className="mt-3 text-center text-gray-600">
            Built for CBSE, ICSE, and State board schools across India
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">Simple, Transparent Pricing</h2>
          <p className="mt-3 text-center text-gray-600">
            Start small, scale as you grow. No hidden fees.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((plan, idx) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                popular={idx === 1}
                onSelect={() => handleSelectPlan(plan)}
              />
            ))}
            {plans.length === 0 && (
              <div className="col-span-3 py-12 text-center text-gray-400">Loading plans...</div>
            )}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      {showRegister && selectedPlan && (
        <section id="register" className="border-t border-gray-100 bg-gray-50 py-20">
          <div className="mx-auto max-w-2xl px-6">
            <RegisterForm plan={selectedPlan} onChangePlan={() => setShowRegister(false)} />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Anvix One. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// =========================================
// Plan Card
// =========================================
function PlanCard({
  plan,
  popular,
  onSelect,
}: {
  plan: Plan;
  popular: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-8 ${
        popular ? 'border-blue-600 ring-2 ring-blue-600' : 'border-gray-200'
      }`}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
          Most Popular
        </span>
      )}
      <h3 className="text-xl font-bold">{plan.name}</h3>
      <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
      <div className="mt-6">
        <span className="text-4xl font-bold">
          ₹{(plan.priceInPaise / 100).toLocaleString('en-IN')}
        </span>
        <span className="text-gray-500">/{plan.billingCycle}</span>
      </div>
      <ul className="mt-6 space-y-3 text-sm text-gray-600">
        <li className="flex items-center gap-2">
          <span className="text-green-500">✓</span> Up to {plan.maxStudents.toLocaleString()}{' '}
          students
        </li>
        <li className="flex items-center gap-2">
          <span className="text-green-500">✓</span> {plan.smsQuota.toLocaleString()} SMS/month
        </li>
        <li className="flex items-center gap-2">
          <span className="text-green-500">✓</span> Student &amp; teacher management
        </li>
        <li className="flex items-center gap-2">
          <span className="text-green-500">✓</span> Attendance tracking
        </li>
        <li className="flex items-center gap-2">
          <span className="text-green-500">✓</span> Fee management
        </li>
      </ul>
      <button
        onClick={onSelect}
        className={`mt-8 w-full rounded-lg py-3 text-sm font-semibold transition-colors ${
          popular
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        Get Started
      </button>
    </div>
  );
}

// =========================================
// Registration Form
// =========================================
function RegisterForm({ plan, onChangePlan }: { plan: Plan; onChangePlan: () => void }) {
  const [schoolName, setSchoolName] = useState('');
  const [board, setBoard] = useState<'cbse' | 'icse' | 'state' | 'other'>('cbse');
  const [principalName, setPrincipalName] = useState('');
  const [principalPhone, setPrincipalPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{
    tenant: { name: string; slug: string; email: string };
    loginUrl: string;
    message: string;
  } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/platform/tenants/register-and-provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName,
          board,
          principalName,
          principalPhone,
          email,
          planId: plan.id,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(body.message || `Registration failed: ${res.status}`);
      }

      const data = await res.json();
      setSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="text-4xl">🎉</div>
        <h2 className="mt-4 text-2xl font-bold text-green-800">School Registered!</h2>
        <p className="mt-2 text-green-700">{success.message}</p>
        <div className="mt-6 rounded-lg bg-white p-4 text-left text-sm">
          <p>
            <strong>School:</strong> {success.tenant.name}
          </p>
          <p>
            <strong>Slug:</strong> {success.tenant.slug}
          </p>
          <p>
            <strong>Admin Email:</strong> {success.tenant.email}
          </p>
        </div>
        <a
          href={success.loginUrl}
          className="mt-6 inline-block rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Go to School Login →
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Register Your School</h2>
          <p className="mt-1 text-sm text-gray-500">
            Selected plan:{' '}
            <strong>
              {plan.name} — ₹{(plan.priceInPaise / 100).toLocaleString('en-IN')}/{plan.billingCycle}
            </strong>
          </p>
        </div>
        <button onClick={onChangePlan} className="text-sm text-blue-600 hover:underline">
          Change plan
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
            <input
              type="text"
              required
              minLength={2}
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              placeholder="e.g., Delhi Public School"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value as typeof board)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            >
              <option value="cbse">CBSE</option>
              <option value="icse">ICSE</option>
              <option value="state">State Board</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Principal Name</label>
            <input
              type="text"
              required
              minLength={2}
              value={principalName}
              onChange={(e) => setPrincipalName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              placeholder="Dr. Rajesh Kumar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              pattern="[6-9]\d{9}"
              value={principalPhone}
              onChange={(e) => setPrincipalPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              placeholder="9876543210"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              placeholder="principal@school.com"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Registering & Setting Up...' : 'Register School'}
        </button>

        <p className="text-center text-xs text-gray-500">
          By registering, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </div>
  );
}

// =========================================
// Features data
// =========================================
const features = [
  {
    icon: '🎓',
    title: 'Student Management',
    desc: 'Admissions, profiles, promotions, and guardian management.',
  },
  {
    icon: '👨‍🏫',
    title: 'Teacher Management',
    desc: 'Staff profiles, subject assignments, and class allocation.',
  },
  {
    icon: '✅',
    title: 'Attendance Tracking',
    desc: 'Daily attendance with real-time parent notifications.',
  },
  {
    icon: '💰',
    title: 'Fee Management',
    desc: 'Fee structures, online payments, receipts, and reminders.',
  },
  {
    icon: '📝',
    title: 'Exam & Results',
    desc: 'Exam scheduling, mark entry, report cards, and analytics.',
  },
  {
    icon: '📱',
    title: 'Parent Portal',
    desc: 'Parents stay connected with attendance, fees, and results.',
  },
];
