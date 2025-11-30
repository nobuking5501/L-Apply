import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from './firebase-admin';

// Subscription plan types
export type SubscriptionPlan = 'test' | 'monitor' | 'regular' | 'pro';
export type SubscriptionStatus = 'active' | 'trial' | 'canceled' | 'past_due';

// Organization subscription interface
export interface OrganizationSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  limits: {
    maxEvents: number;
    maxStepDeliveries: number;
    maxReminders: number;
    maxApplicationsPerMonth: number;
  };
  trialEndsAt: Timestamp | null;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
}

// Organization usage interface
export interface OrganizationUsage {
  eventsCount: number;
  stepDeliveriesCount: number;
  remindersCount: number;
  applicationsThisMonth: number;
  lastResetAt: Timestamp;
}

// Organization with admin info
export interface OrganizationAdmin {
  id: string;
  name?: string;
  email?: string;
  lineChannelAccessToken: string;
  lineChannelSecret: string;
  liffId: string;
  subscription: OrganizationSubscription;
  usage: OrganizationUsage;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Admin statistics
export interface AdminStats {
  totalOrganizations: number;
  organizationsByPlan: {
    test: number;
    monitor: number;
    regular: number;
    pro: number;
  };
  organizationsByStatus: {
    active: number;
    trial: number;
    canceled: number;
    past_due: number;
  };
  totalRevenue: number;
  monthlyRecurringRevenue: number;
}

/**
 * Get all organizations with subscription info
 */
export async function getAllOrganizations(): Promise<OrganizationAdmin[]> {
  const db = getAdminDb();
  const snapshot = await db.collection('organizations').get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      email: data.email || '',
      lineChannelAccessToken: data.lineChannelAccessToken || '',
      lineChannelSecret: data.lineChannelSecret || '',
      liffId: data.liffId || '',
      subscription: data.subscription || getDefaultSubscription(),
      usage: data.usage || getDefaultUsage(),
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: data.updatedAt || Timestamp.now(),
    } as OrganizationAdmin;
  });
}

/**
 * Get organization by ID with subscription info
 */
export async function getOrganizationAdmin(organizationId: string): Promise<OrganizationAdmin | null> {
  const db = getAdminDb();
  const doc = await db.collection('organizations').doc(organizationId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name || '',
    email: data.email || '',
    lineChannelAccessToken: data.lineChannelAccessToken || '',
    lineChannelSecret: data.lineChannelSecret || '',
    liffId: data.liffId || '',
    subscription: data.subscription || getDefaultSubscription(),
    usage: data.usage || getDefaultUsage(),
    createdAt: data.createdAt || Timestamp.now(),
    updatedAt: data.updatedAt || Timestamp.now(),
  } as OrganizationAdmin;
}

/**
 * Update organization plan
 */
export async function updateOrganizationPlan(
  organizationId: string,
  plan: SubscriptionPlan
): Promise<void> {
  const db = getAdminDb();
  const limits = getPlanLimits(plan);
  const now = Timestamp.now();

  await db.collection('organizations').doc(organizationId).update({
    'subscription.plan': plan,
    'subscription.limits': limits,
    updatedAt: now,
  });
}

/**
 * Update organization subscription status
 */
export async function updateOrganizationStatus(
  organizationId: string,
  status: SubscriptionStatus
): Promise<void> {
  const db = getAdminDb();
  const now = Timestamp.now();

  await db.collection('organizations').doc(organizationId).update({
    'subscription.status': status,
    updatedAt: now,
  });
}

/**
 * Initialize subscription for existing organization
 */
export async function initializeOrganizationSubscription(organizationId: string): Promise<void> {
  const db = getAdminDb();
  const doc = await db.collection('organizations').doc(organizationId).get();

  if (!doc.exists) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  const data = doc.data()!;

  // Only initialize if subscription doesn't exist
  if (!data.subscription) {
    const now = Timestamp.now();
    const trialEnd = new Timestamp(now.seconds + 14 * 24 * 60 * 60, 0); // 14 days from now

    await db.collection('organizations').doc(organizationId).update({
      subscription: {
        plan: 'test',
        status: 'trial',
        limits: getPlanLimits('test'),
        trialEndsAt: trialEnd,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
      },
      usage: getDefaultUsage(),
      updatedAt: now,
    });
  }
}

/**
 * Get admin statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  const organizations = await getAllOrganizations();

  const stats: AdminStats = {
    totalOrganizations: organizations.length,
    organizationsByPlan: {
      test: 0,
      monitor: 0,
      regular: 0,
      pro: 0,
    },
    organizationsByStatus: {
      active: 0,
      trial: 0,
      canceled: 0,
      past_due: 0,
    },
    totalRevenue: 0,
    monthlyRecurringRevenue: 0,
  };

  organizations.forEach((org) => {
    // Count by plan
    stats.organizationsByPlan[org.subscription.plan]++;

    // Count by status
    stats.organizationsByStatus[org.subscription.status]++;

    // Calculate revenue (only for active subscriptions)
    if (org.subscription.status === 'active') {
      const planRevenue = getPlanPrice(org.subscription.plan);
      stats.monthlyRecurringRevenue += planRevenue;
    }
  });

  // Total revenue is same as MRR for now
  stats.totalRevenue = stats.monthlyRecurringRevenue;

  return stats;
}

/**
 * Get default subscription (test plan with trial)
 */
function getDefaultSubscription(): OrganizationSubscription {
  const now = Timestamp.now();
  const trialEnd = new Timestamp(now.seconds + 14 * 24 * 60 * 60, 0); // 14 days

  return {
    plan: 'test',
    status: 'trial',
    limits: getPlanLimits('test'),
    trialEndsAt: trialEnd,
    currentPeriodStart: now,
    currentPeriodEnd: trialEnd,
  };
}

/**
 * Get default usage
 */
function getDefaultUsage(): OrganizationUsage {
  return {
    eventsCount: 0,
    stepDeliveriesCount: 0,
    remindersCount: 0,
    applicationsThisMonth: 0,
    lastResetAt: Timestamp.now(),
  };
}

/**
 * Get plan limits based on plan type
 */
function getPlanLimits(plan: SubscriptionPlan) {
  switch (plan) {
    case 'test':
      return {
        maxEvents: 1,
        maxStepDeliveries: 0,
        maxReminders: 0,
        maxApplicationsPerMonth: 10,
      };
    case 'monitor':
      return {
        maxEvents: 10,
        maxStepDeliveries: 3,
        maxReminders: 5,
        maxApplicationsPerMonth: 100,
      };
    case 'regular':
      return {
        maxEvents: 10,
        maxStepDeliveries: 3,
        maxReminders: 10,
        maxApplicationsPerMonth: 300,
      };
    case 'pro':
      return {
        maxEvents: 50,
        maxStepDeliveries: 10,
        maxReminders: 50,
        maxApplicationsPerMonth: 1000,
      };
    default:
      return {
        maxEvents: 3,
        maxStepDeliveries: 3,
        maxReminders: 3,
        maxApplicationsPerMonth: 10,
      };
  }
}

/**
 * Get plan price in JPY
 */
function getPlanPrice(plan: SubscriptionPlan): number {
  switch (plan) {
    case 'test':
      return 0;
    case 'monitor':
      return 980;
    case 'regular':
      return 1980;
    case 'pro':
      return 4980;
    default:
      return 0;
  }
}
