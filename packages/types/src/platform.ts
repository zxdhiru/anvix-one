/** Possible subscription statuses for a tenant */
export type SubscriptionStatus = 'active' | 'past_due' | 'suspended' | 'cancelled' | 'trial';

/** Supported school boards */
export type SchoolBoard = 'cbse' | 'icse' | 'state' | 'other';

/** Tenant record representing a school */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  board: SchoolBoard;
  subscriptionStatus: SubscriptionStatus;
  planId: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Subscription plan */
export interface Plan {
  id: string;
  name: string;
  priceInPaise: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  maxStudents: number;
  features: string[];
  isActive: boolean;
}
