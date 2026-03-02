/** Possible subscription statuses for a tenant */
export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'suspended'
  | 'cancelled'
  | 'trial'
  | 'pending';

/** Supported school boards */
export type SchoolBoard = 'cbse' | 'icse' | 'state' | 'other';

/** Billing cycle options */
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

/** Tenant record representing a school */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  board: SchoolBoard;
  principalName: string;
  principalPhone: string;
  email: string;
  subdomain: string;
  schemaName: string | null;
  subscriptionStatus: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** Subscription plan */
export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceInPaise: number;
  billingCycle: BillingCycle;
  maxStudents: number;
  smsQuota: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Plan feature flag */
export interface PlanFeature {
  id: string;
  planId: string;
  featureKey: string;
  featureValue: unknown;
  createdAt: Date;
}

/** Tenant subscription record */
export interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  razorpaySubscriptionId: string | null;
  razorpayCustomerId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
