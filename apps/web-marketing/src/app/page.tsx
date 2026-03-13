'use client';

import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import {
  GraduationCap,
  Users,
  IndianRupee,
  BarChart3,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Check,
  Star,
  Zap,
  Clock,
  School,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

/* ─── Razorpay Checkout Types ─── */
interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image?: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckout {
  open: () => void;
  close: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

/* ─── Types ─── */
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

/* ─── Intersection Observer Hook ─── */
function useInView(threshold = 0.15): [React.RefCallback<HTMLDivElement>, boolean] {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = (node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    if (node && !visible) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observerRef.current?.disconnect();
          }
        },
        { threshold },
      );
      observerRef.current.observe(node);
    }
  };

  return [setRef, visible];
}

/* ─── Animated Counter ─── */
function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [setRef, visible] = useInView();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1800;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, end]);
  return (
    <span ref={setRef}>
      {count.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

/* ─── Features ─── */
const features = [
  {
    icon: GraduationCap,
    title: 'Student Management',
    desc: 'Admissions, profiles, attendance, report cards — every student detail in one place.',
  },
  {
    icon: Users,
    title: 'Teacher & Staff',
    desc: 'Faculty management, assignments, timetables, and payroll made effortless.',
  },
  {
    icon: IndianRupee,
    title: 'Fee Collection',
    desc: 'Online payments with Razorpay, auto-reminders, receipts, and custom fee structures.',
  },
  {
    icon: BarChart3,
    title: 'Exams & Analytics',
    desc: 'Exam scheduling, marks entry, performance analytics, and printable report cards.',
  },
  {
    icon: Smartphone,
    title: 'Parent Portal',
    desc: 'Real-time updates, homework tracking, and attendance alerts — parents stay connected.',
  },
  {
    icon: ShieldCheck,
    title: 'Isolated & Secure',
    desc: 'Each school gets its own database. Your data is never shared, always encrypted.',
  },
];

/* ─── Testimonials ─── */
const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Principal, DPS Jaipur',
    quote:
      'Anvix One transformed how we manage our school. Fee collection alone saved us 20 hours a month.',
  },
  {
    name: 'Rajesh Patel',
    role: "Admin Head, St. Xavier's Ahmedabad",
    quote: 'The setup took 2 minutes. We were up and running the same day. Incredible.',
  },
  {
    name: 'Anita Desai',
    role: 'Director, Sunrise Academy',
    quote: 'Parents love the app. Our communication improved 10x overnight.',
  },
];

/* ═══════════════════════════════════════════════════════════════
   Home Page
   ═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [featuresRef, featuresVisible] = useInView(0.1);
  const [statsRef, statsVisible] = useInView(0.2);
  const [testimonialsRef, testimonialsVisible] = useInView(0.1);

  useEffect(() => {
    fetch(`${API_BASE}/platform/plans?activeOnly=true`)
      .then((r) => r.json())
      .then((data: Plan[]) => {
        setPlans(data);
        const popular = data.find((p) => p.slug === 'growth') || data[1] || data[0];
        if (popular) setSelectedPlan(popular.id);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* ══════ NAV ══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass box-border" style={{ width: '100vw', maxWidth: '100%' }}>

  <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
    <a
      href="#"
      className="font-display font-bold text-xl tracking-tight text-[var(--foreground)] shrink-0"
    >
      anvix<span className="text-[var(--primary)]">.</span>one
    </a>
    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--muted-foreground)]">
      <a href="#features" className="hover:text-[var(--foreground)] transition-colors">
        Features
      </a>
      <a href="#pricing" className="hover:text-[var(--foreground)] transition-colors">
        Pricing
      </a>
      <a href="#testimonials" className="hover:text-[var(--foreground)] transition-colors">
        Stories
      </a>
      <a href="/manage" className="hover:text-[var(--foreground)] transition-colors">
        Manage
      </a>
    </div>
    <a
      href="#pricing"
      className="inline-flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity shrink-0"
    >
      Get Started <ArrowRight size={14} />
    </a>
  </div>
</nav>

      {/* ══════ HERO ══════ */}
      <section className="relative pt-40 pb-28 px-6 overflow-hidden noise">
        {/* Background decorations */}
        <div className="absolute top-20 -left-40 w-[500px] h-[500px] rounded-full bg-orange-200/30 blur-[120px]" />
        <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] rounded-full bg-amber-100/40 blur-[100px]" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-semibold px-4 py-1.5 rounded-full mb-8 border border-amber-200/60">
            <Sparkles size={13} />
            Built for Indian Schools
          </div>

          <h1 className="animate-fade-up delay-100 font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
            Run your school
            <br />
            <span className="text-[var(--primary)]">like it&apos;s 2025</span>
          </h1>

          <p className="animate-fade-up delay-200 text-lg sm:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Students, teachers, fees, exams, parent communication — everything your school needs, in
            one beautiful platform. Set up in 2 minutes. No training needed.
          </p>

          <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#pricing"
              className="group inline-flex items-center gap-3 bg-[var(--primary)] text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-[#b91c1c] transition-all shadow-lg shadow-orange-600/20"
            >
              Start Free Today
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-[var(--muted-foreground)] text-base font-medium hover:text-[var(--foreground)] transition-colors"
            >
              See how it works <ChevronRight size={15} />
            </a>
          </div>

          {/* Trust badges */}
          <div className="animate-fade-up delay-500 mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-[var(--muted-foreground)]">
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" /> Bank-grade security
            </span>
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-blue-600" /> 2-min setup
            </span>
            <span className="flex items-center gap-2">
              <Zap size={16} className="text-amber-600" /> No credit card needed
            </span>
          </div>
        </div>
      </section>

      {/* ══════ STATS ══════ */}
      <section ref={statsRef} className="py-20 px-6 border-t border-b border-border">
        <div
          className={clsx(
            'max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center transition-all duration-700',
            statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
          )}
        >
          {[
            { value: 500, suffix: '+', label: 'Schools Trust Us' },
            { value: 50000, suffix: '+', label: 'Students Managed' },
            { value: 99, suffix: '.9%', label: 'Uptime Guarantee' },
            { value: 4, suffix: '.9/5', label: 'Customer Rating' },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-display text-3xl sm:text-4xl font-bold text-[var(--foreground)]">
                <Counter end={s.value} suffix={s.suffix} />
              </div>
              <div className="text-sm text-[var(--muted-foreground)] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════ FEATURES ══════ */}
      <section id="features" ref={featuresRef} className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className={clsx(
                'font-display text-3xl sm:text-4xl font-bold mb-4 transition-all duration-700',
                featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
              )}
            >
              Everything your school needs
            </h2>
            <p
              className={clsx(
                'text-[var(--muted-foreground)] text-lg max-w-xl mx-auto transition-all duration-700 delay-100',
                featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
              )}
            >
              Replace 6 different tools with one platform that actually works together.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={clsx(
                    'group relative bg-[var(--card)] rounded-2xl p-7 border border-[var(--border)] hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all duration-300',
                    featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
                  )}
                  style={{
                    transitionDelay: featuresVisible ? `${i * 80}ms` : '0ms',
                  }}
                >
                  <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center mb-5 group-hover:bg-orange-100 transition-colors">
                    <Icon size={20} className="text-[var(--primary)]" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════ PRICING ══════ */}
      <section id="pricing" className="py-24 px-6 bg-[var(--muted)]/40 relative noise">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-100/30 rounded-full blur-[100px]" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Simple, honest pricing
            </h2>
            <p className="text-[var(--muted-foreground)] text-lg max-w-xl mx-auto">
              No hidden fees. No per-student charges that surprise you. Pick a plan, start in
              minutes.
            </p>
          </div>

          {plans.length > 0 && !showRegister && (
            <div className="stagger grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              {plans.map((plan) => {
                const price = plan.priceInPaise / 100;
                const isPopular =
                  plan.slug === 'growth' || (plans.length === 2 && plan === plans[1]);
                const isSelected = selectedPlan === plan.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={clsx(
                      'relative text-left rounded-2xl p-7 border-2 transition-all duration-200 cursor-pointer',
                      isSelected
                        ? 'border-[var(--primary)] bg-white shadow-xl shadow-orange-100/60 scale-[1.02]'
                        : 'border-[var(--border)] bg-white/80 hover:border-orange-200 hover:shadow-md',
                    )}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-6 inline-flex items-center gap-1 bg-[var(--primary)] text-white text-xs font-bold px-3 py-1 rounded-full">
                        <Star size={11} /> Most Popular
                      </div>
                    )}

                    <h3 className="font-display font-bold text-xl mb-1">{plan.name}</h3>
                    <p className="text-[var(--muted-foreground)] text-sm mb-5">
                      {plan.description}
                    </p>

                    <div className="mb-5">
                      <span className="font-display text-4xl font-extrabold">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[var(--muted-foreground)] text-sm ml-1">
                        /{plan.billingCycle}
                      </span>
                    </div>

                    <ul className="space-y-2.5 text-sm mb-6">
                      <li className="flex items-center gap-2">
                        <Check size={15} className="text-emerald-600 shrink-0" />
                        Up to {plan.maxStudents.toLocaleString('en-IN')} students
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={15} className="text-emerald-600 shrink-0" />
                        {plan.smsQuota.toLocaleString('en-IN')} SMS per month
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={15} className="text-emerald-600 shrink-0" />
                        All core modules included
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={15} className="text-emerald-600 shrink-0" />
                        Free onboarding support
                      </li>
                    </ul>

                    <div
                      className={clsx(
                        'w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors',
                        isSelected
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--muted)] text-[var(--foreground)]',
                      )}
                    >
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* CTA to show registration form */}
          {!showRegister && selectedPlan && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="group inline-flex items-center gap-3 bg-[var(--primary)] text-white text-lg font-semibold px-10 py-4 rounded-xl hover:bg-[#b91c1c] transition-all shadow-lg shadow-orange-600/20 cursor-pointer"
              >
                Continue — Create Your School
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </button>
              <p className="text-[var(--muted-foreground)] text-sm mt-4">
                Free for 14 days. No credit card required.
              </p>
            </div>
          )}

          {/* Registration Form */}
          {showRegister && (
            <RegisterForm
              plans={plans}
              selectedPlan={selectedPlan}
              onBack={() => setShowRegister(false)}
            />
          )}
        </div>
      </section>

      {/* ══════ TESTIMONIALS ══════ */}
      <section id="testimonials" ref={testimonialsRef} className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className={clsx(
                'font-display text-3xl sm:text-4xl font-bold mb-4 transition-all duration-700',
                testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
              )}
            >
              Loved by schools across India
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className={clsx(
                  'bg-[var(--card)] border border-[var(--border)] rounded-2xl p-7 transition-all duration-700',
                  testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
                )}
                style={{
                  transitionDelay: testimonialsVisible ? `${i * 100}ms` : '0ms',
                }}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[var(--foreground)] leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-[var(--muted-foreground)] text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FINAL CTA ══════ */}
      <section className="py-24 px-6 bg-[var(--foreground)] text-[var(--background)] relative noise overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-900/20 rounded-full blur-[150px]" />
        <div className="relative max-w-3xl mx-auto text-center">
          <School size={40} className="mx-auto mb-6 opacity-60" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Ready to modernize your school?
          </h2>
          <p className="text-lg opacity-70 mb-10 max-w-xl mx-auto">
            Join hundreds of schools already using Anvix One. Set up takes less time than making
            chai.
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-3 bg-[var(--primary)] text-white text-lg font-semibold px-10 py-4 rounded-xl hover:bg-[#b91c1c] transition-all"
          >
            Start Free Today <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-[var(--border)] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-display font-bold text-lg">
            anvix<span className="text-[var(--primary)]">.</span>one
          </div>
          <div className="flex items-center gap-8 text-sm text-[var(--muted-foreground)]">
            <a href="#features" className="hover:text-[var(--foreground)] transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-[var(--foreground)] transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="hover:text-[var(--foreground)] transition-colors">
              Stories
            </a>
            <a href="/manage" className="hover:text-[var(--foreground)] transition-colors">
              Manage
            </a>
          </div>
          <div className="text-sm text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} Anvix One · Made with ♥ for Indian schools
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Registration Form Component
   ═══════════════════════════════════════════════════════════════ */

function RegisterForm({
  plans,
  selectedPlan,
  onBack,
}: {
  plans: Plan[];
  selectedPlan: string;
  onBack: () => void;
}) {
  const selectedPlanObj = plans.find((p) => p.id === selectedPlan);
  const [step, setStep] = useState(1);
  const [schoolName, setSchoolName] = useState('');
  const [board, setBoard] = useState('cbse');
  const [principalName, setPrincipalName] = useState('');
  const [principalPhone, setPrincipalPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentState, setPaymentState] = useState<
    'idle' | 'creating' | 'checkout' | 'processing' | 'success' | 'failed'
  >('idle');
  const [successData, setSuccessData] = useState<{
    tenantName: string;
    tenantSlug: string;
    planName: string;
    paymentId?: string;
  } | null>(null);

  /** Open Razorpay Checkout modal for subscription autopay setup */
  const openRazorpayCheckout = useCallback(
    (data: {
      subscriptionId: string;
      razorpayKeyId: string;
      tenantName: string;
      tenantSlug: string;
      planName: string;
      billingCycle: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      amount: number;
    }) => {
      if (!window.Razorpay) {
        setError('Payment system is loading. Please wait a moment and try again.');
        setPaymentState('idle');
        setSubmitting(false);
        return;
      }

      setPaymentState('checkout');

      const options: RazorpayOptions = {
        key: data.razorpayKeyId || RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: 'Anvix One',
        description: `${data.planName} — ${data.billingCycle} plan`,
        prefill: {
          name: data.customerName,
          email: data.customerEmail,
          contact: data.customerPhone,
        },
        notes: {
          schoolName: data.tenantName,
          tenantSlug: data.tenantSlug,
        },
        theme: { color: '#c2410c' },
        handler: (response: RazorpayResponse) => {
          // Payment authorized successfully!
          setPaymentState('processing');
          // Short delay to let webhook fire, then show success
          setTimeout(() => {
            setPaymentState('success');
            setSuccessData({
              tenantName: data.tenantName,
              tenantSlug: data.tenantSlug,
              planName: data.planName,
              paymentId: response.razorpay_payment_id,
            });
            setSubmitting(false);
          }, 2000);
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setPaymentState('idle');
            setSubmitting(false);
            setError(
              'Payment was cancelled. Your school is saved — you can retry payment anytime.',
            );
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setPaymentState('failed');
        setSubmitting(false);
        setError('Payment failed. Please try again or use a different payment method.');
      });
      rzp.open();
    },
    [],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    setPaymentState('creating');

    try {
      // Step 1: Register school + create Razorpay subscription
      const res = await fetch(`${API_BASE}/platform/billing/register-and-subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName,
          board,
          principalName,
          principalPhone,
          email,
          planId: selectedPlan,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Server error ${res.status}`);
      }

      const data = await res.json();

      // Step 2: Open Razorpay Checkout for UPI autopay setup
      openRazorpayCheckout(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setPaymentState('idle');
      setSubmitting(false);
    }
  }

  /* ── Payment Processing State ── */
  if (paymentState === 'processing') {
    return (
      <div className="animate-fade-up max-w-lg mx-auto text-center">
        <div className="bg-white border border-orange-200 rounded-3xl p-10 shadow-xl shadow-orange-50/60">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 size={32} className="text-[var(--primary)] animate-spin" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Setting up your school…</h2>
          <p className="text-[var(--muted-foreground)]">
            Payment received! We&apos;re preparing your school dashboard. This takes just a moment.
          </p>
        </div>
      </div>
    );
  }

  /* ── Success State ── */
  if (paymentState === 'success' && successData) {
    return (
      <div className="animate-scale-in max-w-lg mx-auto text-center">
        <div className="bg-white border border-emerald-200 rounded-3xl p-10 shadow-xl shadow-emerald-50/60">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-emerald-600" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Payment successful!</h2>
          <p className="text-[var(--muted-foreground)] mb-2">
            Your school is being provisioned. You&apos;ll receive an email when it&apos;s ready.
          </p>
          <p className="font-semibold text-lg mb-1">{successData.tenantName}</p>
          <p className="text-sm text-[var(--muted-foreground)] mb-2">
            School ID:{' '}
            <span className="font-mono text-[var(--foreground)]">{successData.tenantSlug}</span>
            {' · '}
            {successData.planName} Plan
          </p>
          {successData.paymentId && (
            <p className="text-xs text-[var(--muted-foreground)] mb-8">
              Payment ID: <span className="font-mono">{successData.paymentId}</span>
            </p>
          )}
          <div className="flex flex-col gap-3">
            <a
              href="/manage"
              className="group inline-flex items-center justify-center gap-3 bg-[var(--primary)] text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-[#b91c1c] transition-all shadow-lg shadow-orange-600/20"
            >
              Manage Your Subscription
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-4">
            UPI autopay has been set up. Your subscription will renew automatically.
          </p>
        </div>
      </div>
    );
  }

  /* ── Payment Failed State ── */
  if (paymentState === 'failed') {
    return (
      <div className="animate-fade-up max-w-lg mx-auto text-center">
        <div className="bg-white border border-red-200 rounded-3xl p-10 shadow-xl shadow-red-50/60">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <IndianRupee size={32} className="text-red-600" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Payment failed</h2>
          <p className="text-[var(--muted-foreground)] mb-6">
            Don&apos;t worry — your school details are saved. You can retry payment anytime.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPaymentState('idle');
                setError('');
              }}
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#b91c1c] transition-all cursor-pointer"
            >
              Try Again
            </button>
            <a
              href="/manage"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Go to Manage Portal <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Multi-step Form ── */
  return (
    <div className="animate-fade-up max-w-lg mx-auto">
      <div className="bg-white border border-[var(--border)] rounded-3xl p-8 sm:p-10 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-display font-bold text-xl">Create your school</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {selectedPlanObj ? `${selectedPlanObj.name} Plan` : 'Selected plan'} · Step {step} of
              2
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            ← Back
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          <div
            className={clsx(
              'h-1.5 rounded-full flex-1 transition-colors',
              step >= 1 ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]',
            )}
          />
          <div
            className={clsx(
              'h-1.5 rounded-full flex-1 transition-colors',
              step >= 2 ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]',
            )}
          />
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-5">
              <InputField
                label="School Name"
                required
                value={schoolName}
                onChange={setSchoolName}
                placeholder="Bright Future Public School"
              />
              <div>
                <label className="block text-sm font-medium mb-2">Education Board</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'cbse', label: 'CBSE' },
                    { value: 'icse', label: 'ICSE' },
                    { value: 'state', label: 'State Board' },
                    { value: 'other', label: 'Other' },
                  ].map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setBoard(b.value)}
                      className={clsx(
                        'py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer',
                        board === b.value
                          ? 'border-[var(--primary)] bg-orange-50 text-[var(--primary)]'
                          : 'border-[var(--border)] hover:border-orange-200',
                      )}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!schoolName.trim()) {
                    setError('Please enter your school name.');
                    return;
                  }
                  setError('');
                  setStep(2);
                }}
                className="w-full bg-[var(--foreground)] text-[var(--background)] py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                Continue →
              </button>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <InputField
                label="Your Full Name"
                required
                value={principalName}
                onChange={setPrincipalName}
                placeholder="Rajesh Kumar"
              />
              <InputField
                label="Phone Number"
                required
                type="tel"
                pattern="[6-9]\d{9}"
                value={principalPhone}
                onChange={setPrincipalPhone}
                placeholder="9876543210"
                hint="10-digit Indian mobile number"
              />
              <InputField
                label="Email Address"
                required
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@school.com"
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3.5 rounded-xl font-semibold text-sm border border-[var(--border)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={clsx(
                    'flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all cursor-pointer',
                    submitting
                      ? 'bg-orange-300 text-white cursor-wait'
                      : 'bg-[var(--primary)] text-white hover:bg-[#b91c1c]',
                  )}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {paymentState === 'creating' ? 'Setting up payment…' : 'Opening payment…'}
                    </span>
                  ) : (
                    <>
                      Proceed to Payment — ₹
                      {selectedPlanObj
                        ? (selectedPlanObj.priceInPaise / 100).toLocaleString('en-IN')
                        : '0'}
                      /{selectedPlanObj?.billingCycle ?? 'month'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      <p className="text-center text-xs text-[var(--muted-foreground)] mt-4">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Input Field Component
   ═══════════════════════════════════════════════════════════════ */

function InputField({
  label,
  hint,
  value,
  onChange,
  ...props
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30 focus:border-[var(--primary)] transition-all placeholder:text-[var(--muted-foreground)]/50"
        {...props}
      />
      {hint && <p className="text-xs text-[var(--muted-foreground)] mt-1.5">{hint}</p>}
    </div>
  );
}
