export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
} as const;

export type SUBSCRIPTION_PLANS_INTERFACE = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS];
export const SUBSCRIPTION_PLANS_ENUM = Object.values(SUBSCRIPTION_PLANS);

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
  TRIAL: 'trial',
} as const;

export type SUBSCRIPTION_STATUS_INTERFACE = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];
export const SUBSCRIPTION_STATUS_ENUM = Object.values(SUBSCRIPTION_STATUS);

export const SUBSCRIPTION_DURATION = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime',
} as const;

export type SUBSCRIPTION_DURATION_INTERFACE = typeof SUBSCRIPTION_DURATION[keyof typeof SUBSCRIPTION_DURATION];
export const SUBSCRIPTION_DURATION_ENUM = Object.values(SUBSCRIPTION_DURATION);
