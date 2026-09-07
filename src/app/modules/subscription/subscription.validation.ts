import { z } from 'zod';
import { SUBSCRIPTION_PLANS_ENUM, SUBSCRIPTION_STATUS_ENUM } from './subscription.constants';

const createSubscriptionSchema = z.object({
  body: z.object({
    userId: z.string({ message: 'User ID is required' }),
    plan: z.enum(SUBSCRIPTION_PLANS_ENUM as [string, ...string[]], {
      message: 'Invalid subscription plan',
    }),
    startDate: z.string({ message: 'Start date is required' }).datetime(),
    endDate: z.string({ message: 'End date is required' }).datetime(),
    price: z.number({ message: 'Price is required' }).positive(),
    currency: z.string().optional(),
    paymentMethod: z.string().optional(),
    transactionId: z.string().optional(),
    autoRenew: z.boolean().optional(),
    notes: z.string().optional(),
  }),
});

const updateSubscriptionSchema = z.object({
  body: z.object({
    title: z.enum(SUBSCRIPTION_PLANS_ENUM as [string, ...string[]]).optional(),
    status: z.enum(SUBSCRIPTION_STATUS_ENUM as [string, ...string[]]).optional(),
    endDate: z.string().datetime().optional(),
    autoRenew: z.boolean().optional(),
    notes: z.string().optional(),
  }),
});

const cancelSubscriptionSchema = z.object({
  body: z.object({
    reason: z.string().optional(),
  }),
});

const createSubscriptionPlanSchema = z.object({
  body: z.object({
    title: z.enum(['free', 'pro', 'premium'], {
      message: 'Invalid plan name',
    }),
    description: z.string(),
    price: z.number({ message: 'Price is required' }).min(0),
    durationInDays: z.number({ message: 'Duration in days is required' }).positive(),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateSubscriptionPlanSchema = z.object({
  body: z.object({
    // title: z.enum(['free', 'pro', 'premium']).optional(),
    // description: z.string().optional(),
    price: z.number().min(0).optional(),
    // durationInDays: z.number().positive().optional(),
    // features: z.array(z.string()).optional(),
    // isActive: z.boolean().optional(),
  }),
});

export const subscriptionValidation = {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  cancelSubscriptionSchema,
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
};
