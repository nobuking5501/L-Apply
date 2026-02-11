import { Timestamp } from 'firebase-admin/firestore';

export type ApplicationStatus = 'applied' | 'canceled';

export type ReminderType = 'T-24h' | 'day-of' | 'custom';

export type StepDeliveryStatus = 'pending' | 'sending' | 'sent' | 'skipped';

export type PlanType = 'test' | 'monitor' | 'regular' | 'pro' | 'unlimited';

export type SubscriptionStatus = 'active' | 'trial' | 'canceled' | 'past_due';

export interface OrganizationSubscription {
  plan: PlanType;
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

export interface OrganizationUsage {
  eventsCount: number;
  stepDeliveriesCount: number;
  remindersCount: number;
  applicationsThisMonth: number;
  lastResetAt: Timestamp;
}

export interface OrganizationAddon {
  purchased: boolean;
  purchasedAt?: Timestamp;
  stripePaymentIntentId?: string;
  amountPaid?: number;
  manuallyEnabled?: boolean;
  enabledBy?: string;
  enabledAt?: Timestamp;
}

export interface Organization {
  id: string;
  name?: string;
  email?: string;

  // Owner information
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

  // Subscription & Usage
  subscription: OrganizationSubscription;
  usage: OrganizationUsage;

  // Add-ons
  addons?: Record<string, OrganizationAddon>;

  // Feature flags (explicit opt-in for automated features)
  features?: {
    stepDeliveryEnabled?: boolean;   // Default: false - must be explicitly enabled
    reminderEnabled?: boolean;        // Default: true for backward compatibility
    welcomeMessageEnabled?: boolean;  // Default: false - must be explicitly enabled
  };

  // Account management
  disabled?: boolean;

  // Branding (optional)
  logoUrl?: string;
  primaryColor?: string;
  companyName?: string;

  // Metadata
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface LineUser {
  userId: string;
  displayName: string;
  consent: boolean;
  organizationId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Application {
  id?: string;
  userId: string;
  slotAt: Timestamp;
  plan: string;
  notes?: string;
  status: ApplicationStatus;
  organizationId?: string;
  createdAt: Timestamp;
  // Event management fields (optional for backward compatibility)
  eventId?: string;
  slotId?: string;
}

export interface Reminder {
  id?: string;
  applicationId: string;
  userId: string;
  scheduledAt: Timestamp;
  type: ReminderType;
  sentAt: Timestamp | null;
  canceled: boolean;
  message: string;
  organizationId?: string;
}

export interface StepDelivery {
  id?: string;
  applicationId: string;
  userId: string;
  stepNumber: number;
  scheduledAt: Timestamp;
  sentAt: Timestamp | null;
  status: StepDeliveryStatus;
  message: string;
  organizationId?: string;
  createdAt: Timestamp;
}

export interface ApplyRequestBody {
  idToken: string;
  liffId: string;
  plan: string;
  slotAt: string; // ISO 8601 string
  notes?: string;
  consent: boolean;
  // Event management fields (optional for backward compatibility)
  eventId?: string;
  slotId?: string;
}

// Global config (environment variables)
export interface GlobalConfig {
  app: {
    baseUrl: string;
  };
}

// Organization-specific config (from Firestore)
export interface OrganizationConfig {
  organizationId: string;
  line: {
    channelAccessToken: string;
    channelSecret: string;
  };
  liff: {
    id: string;
  };
}

// Legacy interface (deprecated, kept for backward compatibility)
export interface Config {
  line: {
    channelAccessToken: string;
    channelSecret: string;
  };
  liff: {
    id: string;
  };
  app: {
    baseUrl: string;
    organizationId: string;
  };
}
