import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { Plan } from './plan.model';
import { Subscription } from './subscription.model';
import { IPlan } from './plan.interface';
import {
  IAdminCreateSubscriptionPayload,
  ISubscription,
} from './subscription.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import { User } from '../user/user.models';
import { cacheKeys, cacheService, CACHE_TTL } from '../../redis';

// ==========================================
// Plan Services (Admin CRUD + Cached Reads)
// ==========================================

const createPlan = async (payload: IPlan) => {
  const existingPlan = await Plan.findOne({
    name: payload.name,
    billingCycle: payload.billingCycle,
  });

  if (existingPlan) {
    throw new AppError(
      httpStatus.CONFLICT,
      `A ${payload.billingCycle} plan with name '${payload.name}' already exists.`,
    );
  }

  const newPlan = await Plan.create(payload);

  // Invalidate plan caches
  await cacheService.delByPattern(cacheKeys.plansAllPattern());

  return newPlan;
};

const getActivePlans = async () => {
  const cacheKey = cacheKeys.activePlans();

  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      return await Plan.find({ isActive: true }).sort({ price: 1 }).lean();
    },
    CACHE_TTL.ONE_HOUR,
  );
};

const getAllPlans = async (query: Record<string, unknown>) => {
  const planQuery = new QueryBuilder(Plan.find(), query)
    .search(['name', 'billingCycle'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await planQuery.countTotal();
  const result = await planQuery.modelQuery;

  return { meta, result };
};

const updatePlan = async (planId: string, payload: Partial<IPlan>) => {
  const updatedPlan = await Plan.findByIdAndUpdate(
    planId,
    { $set: payload },
    { new: true, runValidators: true },
  );

  if (!updatedPlan) {
    throw new AppError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  // Invalidate plan caches
  await cacheService.delByPattern(cacheKeys.plansAllPattern());

  return updatedPlan;
};

const deletePlan = async (planId: string) => {
  const deletedPlan = await Plan.findByIdAndDelete(planId);

  if (!deletedPlan) {
    throw new AppError(httpStatus.NOT_FOUND, 'Plan not found');
  }

  // Invalidate plan caches
  await cacheService.delByPattern(cacheKeys.plansAllPattern());

  return deletedPlan;
};

// ====================================================
// Subscription Services (Admin Managed + Redis Caching)
// ====================================================

const adminCreateSubscription = async (
  payload: IAdminCreateSubscriptionPayload,
) => {
  const {
    userId,
    planId,
    stripeCustomerId,
    stripeSubscriptionId,
    status = 'active',
    autoRenew = true,
  } = payload;

  // 1. Verify User exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'Target user not found');
  }

  // 2. Verify Plan exists
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, 'Selected plan not found');
  }

  // 3. Compute subscription dates
  const startDate = payload.currentPeriodStart
    ? new Date(payload.currentPeriodStart)
    : new Date();

  let endDate: Date;
  if (payload.currentPeriodEnd) {
    endDate = new Date(payload.currentPeriodEnd);
  } else {
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (plan.durationInMonths || 1));
  }

  // 4. Create Subscription
  const newSubscription = await Subscription.create({
    user: userId,
    plan: planId,
    stripeCustomerId,
    stripeSubscriptionId,
    status,
    autoRenew,
    currentPeriodStart: startDate,
    currentPeriodEnd: endDate,
  });

  // 5. Link subscription ID to User document
  await User.findByIdAndUpdate(userId, {
    $set: { subscriptionId: newSubscription._id },
  });

  // 6. Invalidate relevant caches (user profile & subscriptions)
  await Promise.all([
    cacheService.delByPattern(cacheKeys.userPattern(userId)),
    cacheService.delByPattern(cacheKeys.subscriptionPattern(userId)),
    cacheService.delByPattern(cacheKeys.usersAllPattern()),
  ]);

  return newSubscription;
};

const adminUpdateSubscription = async (
  subscriptionId: string,
  payload: Partial<ISubscription>,
) => {
  const existingSubscription = await Subscription.findById(subscriptionId);
  if (!existingSubscription) {
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
  }

  const updatedSubscription = await Subscription.findByIdAndUpdate(
    subscriptionId,
    { $set: payload },
    { new: true, runValidators: true },
  ).populate('plan');

  if (!updatedSubscription) {
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
  }

  const userId = existingSubscription.user.toString();

  // Invalidate relevant caches
  await Promise.all([
    cacheService.delByPattern(cacheKeys.userPattern(userId)),
    cacheService.delByPattern(cacheKeys.subscriptionPattern(userId)),
  ]);

  return updatedSubscription;
};

const getAllSubscriptions = async (query: Record<string, unknown>) => {
  const subscriptionQuery = new QueryBuilder(
    Subscription.find().populate('user', 'email fullName role businessDetails').populate('plan'),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await subscriptionQuery.countTotal();
  const result = await subscriptionQuery.modelQuery;

  return { meta, result };
};

const getMyActiveSubscription = async (userId: string) => {
  const cacheKey = cacheKeys.userActiveSubscription(userId);

  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      const activeSubscription = await Subscription.findOne({
        user: userId,
        status: 'active',
        currentPeriodEnd: { $gte: new Date() },
      })
        .populate('plan')
        .sort({ currentPeriodEnd: -1 })
        .lean();

      return activeSubscription;
    },
    CACHE_TTL.TEN_MINUTES,
  );
};

const getSubscriptionById = async (subscriptionId: string) => {
  const subscription = await Subscription.findById(subscriptionId)
    .populate('user', 'email fullName role businessDetails')
    .populate('plan')
    .lean();

  if (!subscription) {
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
  }

  return subscription;
};

export const subscriptionService = {
  // Plan methods
  createPlan,
  getActivePlans,
  getAllPlans,
  updatePlan,
  deletePlan,

  // Subscription methods
  adminCreateSubscription,
  adminUpdateSubscription,
  getAllSubscriptions,
  getMyActiveSubscription,
  getSubscriptionById,
};
