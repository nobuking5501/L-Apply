// Multi-tenant type definitions

// Plan types - matches actual Firestore implementation
export type PlanType = 'test' | 'monitor' | 'regular' | 'pro' | 'unlimited';
export type SubscriptionStatus = 'active' | 'trial' | 'canceled' | 'past_due';
export type UserRole = 'admin' | 'owner' | 'member';
export type StepDeliveryStatus = 'pending' | 'sending' | 'sent' | 'skipped';

export interface OrganizationSubscription {
  plan: PlanType;
  status: SubscriptionStatus;
  limits: {
    maxEvents: number;
    maxStepDeliveries: number;
    maxReminders: number;
    maxApplicationsPerMonth: number;
  };
  trialEndsAt: any | null;
  currentPeriodStart: any;
  currentPeriodEnd: any;
}

export interface OrganizationUsage {
  eventsCount: number;
  stepDeliveriesCount: number;
  remindersCount: number;
  applicationsThisMonth: number;
  lastResetAt: any;
}

export interface OrganizationAddon {
  purchased: boolean;
  purchasedAt?: any;
  stripePaymentIntentId?: string;
  amountPaid?: number;
  manuallyEnabled?: boolean;
  enabledBy?: string;
  enabledAt?: any;
}

export interface Organization {
  id: string;
  name?: string;
  email?: string;

  // Owner information (for admin dashboard)
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;

  // LINE Integration
  lineChannelId?: string;
  lineChannelSecret?: string;
  lineChannelAccessToken?: string;
  liffId?: string;
  lineDisplayName?: string;
  lineUserId?: string;

  // Subscription & Usage (actual structure used in Firestore)
  subscription: OrganizationSubscription;
  usage: OrganizationUsage;

  // Add-ons
  addons?: Record<string, OrganizationAddon>;

  // Account management
  disabled?: boolean;

  // Branding (legacy, may still be used)
  logoUrl?: string;
  primaryColor?: string;
  companyName?: string;

  // Metadata
  createdAt: any;
  updatedAt?: any;

  // Legacy plan field (deprecated - use subscription.plan instead)
  plan?: PlanType;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  organizationId: string;
  role: UserRole;
  createdAt: any;
  updatedAt?: any;
}

export interface Event {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  location: string;
  slots: EventSlot[];
  createdAt: any;
  updatedAt?: any;
  isActive: boolean;
}

export interface EventSlot {
  id: string;
  date: string;
  time: string;
  maxCapacity: number;
  currentCapacity: number;
}

export interface Application {
  id: string;
  organizationId: string;
  // Dashboard application fields (new format)
  eventId?: string;
  name?: string;
  phone?: string;
  email?: string;
  slotId?: string;
  consent?: boolean;
  status: 'pending' | 'confirmed' | 'cancelled' | 'applied' | 'canceled';
  // LINE application fields (legacy format)
  userId?: string;
  plan?: string;
  notes?: string;
  // Common fields
  slotAt: any;
  createdAt: any;
}

export interface StepDelivery {
  id: string;
  organizationId: string;
  applicationId: string;
  userId: string;
  stepNumber: number;
  scheduledAt: any;
  sentAt: any | null;
  status: StepDeliveryStatus;
  message: string;
  createdAt: any;
}

export interface DashboardStats {
  totalApplications: number;
  monthlyApplications: number;
  totalDeliveries: number;
  activeEvents: number;
  conversionRate?: number;
}

export interface StepMessageTemplate {
  step: number;
  delayDays: number;
  message: string;
  isActive: boolean;
}
