// Multi-tenant type definitions

export type PlanType = 'free' | 'standard' | 'premium';
export type UserRole = 'admin' | 'owner' | 'member';
export type StepDeliveryStatus = 'pending' | 'sent' | 'skipped';

export interface Organization {
  id: string;
  name: string;
  plan: PlanType;
  ownerId: string;
  createdAt: any;
  updatedAt?: any;
  // LINE Integration (flat structure)
  lineChannelId?: string;
  lineChannelSecret?: string;
  lineChannelAccessToken?: string;
  liffId?: string;
  // Branding
  logoUrl?: string;
  primaryColor?: string;
  companyName?: string;
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
