import { z } from 'zod';

const createPlanSchema = z.object({
  body: z.object({
    name: z.enum(['basic', 'pro'], {
      message: 'Plan name must be either basic or pro',
    }),
    billingCycle: z.enum(['monthly', 'yearly'], {
      message: 'Billing cycle must be either monthly or yearly',
    }),
    price: z.number({ message: 'Price is required' }).min(0),
    originalPrice: z.number({ message: 'Original price is required' }).min(0),
    durationInMonths: z.union([z.literal(1), z.literal(12)], {
      message: 'Duration in months must be 1 or 12',
    }),
    stripePriceId: z.string({ message: 'Stripe price ID is required' }).min(1),
    isActive: z.boolean().optional(),
  }),
});

const updatePlanSchema = z.object({
  body: z.object({
    name: z.enum(['basic', 'pro']).optional(),
    billingCycle: z.enum(['monthly', 'yearly']).optional(),
    price: z.number().min(0).optional(),
    originalPrice: z.number().min(0).optional(),
    durationInMonths: z.union([z.literal(1), z.literal(12)]).optional(),
    stripePriceId: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

const adminCreateSubscriptionSchema = z.object({
  body: z.object({
    userId: z.string({ message: 'User ID is required' }),
    planId: z.string({ message: 'Plan ID is required' }),
    stripeCustomerId: z.string({ message: 'Stripe customer ID is required' }),
    stripeSubscriptionId: z.string({ message: 'Stripe subscription ID is required' }),
    status: z
      .enum(['active', 'canceled', 'past_due', 'unpaid', 'incomplete'])
      .optional(),
    autoRenew: z.boolean().optional(),
    currentPeriodStart: z.string().datetime().optional(),
    currentPeriodEnd: z.string().datetime().optional(),
  }),
});

const adminUpdateSubscriptionSchema = z.object({
  body: z.object({
    planId: z.string().optional(),
    status: z
      .enum(['active', 'canceled', 'past_due', 'unpaid', 'incomplete'])
      .optional(),
    autoRenew: z.boolean().optional(),
    currentPeriodEnd: z.string().datetime().optional(),
    cancelAt: z.string().datetime().optional(),
  }),
});

export const subscriptionValidation = {
  createPlanSchema,
  updatePlanSchema,
  adminCreateSubscriptionSchema,
  adminUpdateSubscriptionSchema,
};
