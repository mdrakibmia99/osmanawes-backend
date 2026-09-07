/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { Transaction, SubscriptionPlan } from './subscription.model';
import { TSubscriptionCreate, TSubscriptionUpdate, ISubscriptionPlan } from './subscription.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import { SUBSCRIPTION_STATUS } from './subscription.constants';
import mongoose from 'mongoose';
import { User } from '../user/user.models';
import { IJwtPayload } from '../auth/auth.interface';
import { USER_ROLE } from '../user/user.constants';

const createSubscription = async (payload: TSubscriptionCreate) => {
  const existingSubscription = await Transaction.findOne({
    userId: payload.userId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  });

  if (existingSubscription) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'User already has an active subscription'
    );
  }

  const subscription = await Transaction.create(payload);

  if (!subscription) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create subscription'
    );
  }

  return subscription;
};

const getUserSubscriptions = async (userId: string) => {
  const subscriptions = await User.findById(userId).select('subscriptionType subscriptionExpiresAt').lean();
  return subscriptions;
};

const getActiveSubscription = async (userId: string) => {
  const subscription = await Transaction.findOne({
    userId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    endDate: { $gte: new Date() },
  }).sort({ endDate: -1 });

  return subscription;
};

const updateSubscription = async (
  subscriptionId: string,
  payload: Partial<TSubscriptionUpdate>
) => {
  const subscription = await Transaction.findById(subscriptionId);

  if (!subscription) {
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
  }

  const updatedSubscription = await Transaction.findByIdAndUpdate(
    subscriptionId,
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!updatedSubscription) {
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
  }

  return updatedSubscription;
};

const cancelSubscription = async (
  subscriptionId: string,
  userId: string,
  reason?: string
) => {
  const subscription = await Transaction.findById(subscriptionId);

  if (!subscription) {
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
  }

  if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Only active subscriptions can be cancelled'
    );
  }

  const cancelledSubscription = await Transaction.findByIdAndUpdate(
    subscriptionId,
    {
      $set: {
        status: SUBSCRIPTION_STATUS.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: userId,
        notes: reason
          ? `${subscription.notes || ''} | Cancellation reason: ${reason}`
          : subscription.notes,
      },
    },
    { new: true, runValidators: true }
  );

  return cancelledSubscription;
};

const getAllSubscriptions = async (query: Record<string, unknown>) => {
  const subscriptionQuery = new QueryBuilder(
    Transaction.find().populate('userId', 'fullName email'),
    query
  )
    .search(['plan', 'transactionId'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await subscriptionQuery.modelQuery;
  const meta = await subscriptionQuery.countTotal();

  return { meta, result };
};



const checkSubscriptionExpiry = async () => {
  const now = new Date();

  const expiredSubscriptions = await Transaction.updateMany(
    {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      endDate: { $lt: now },
    },
    {
      $set: { status: SUBSCRIPTION_STATUS.EXPIRED },
    }
  );

  return expiredSubscriptions;
};

// =====================
// Subscription Plan Services
// =====================
const createSubscriptionPlan = async (payload: ISubscriptionPlan) => {
  const existingPlan = await SubscriptionPlan.findOne({ title: payload.title });

  if (existingPlan) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Subscription plan '${payload.title}' already exists`
    );
  }

  const plan = await SubscriptionPlan.create(payload);

  if (!plan) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create subscription plan'
    );
  }

  return plan;
};

const updateSubscriptionPlan = async (
  planId: string,
  payload: Partial<ISubscriptionPlan>
) => {
  const plan = await SubscriptionPlan.findById(planId);

  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription plan not found');
  }

  const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(
    planId,
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!updatedPlan) {
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription plan not found');
  }

  return updatedPlan;
};

const getAllSubscriptionPlans = async () => {
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({
    price: 1,
  });

  return plans;
};








// transaction part  
const createTransaction = async (
  userId: string,
  payload: any
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid user id');
    }

    if (!mongoose.Types.ObjectId.isValid(payload.subscriptionPlanId)) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid subscription id');
    }

    // 2. Validate amount
    if (payload.amount <= 0) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Amount must be greater than 0');
    }

    // 3. Check subscription exists
    const subscriptionPlan = await SubscriptionPlan.findById(payload.subscriptionPlanId).session(session);

    if (!subscriptionPlan) {
      throw new AppError(httpStatus.NOT_FOUND, 'Subscription plan not found');
    }


    // 6. Create transaction
    const transaction = await Transaction.create(
      [
        {

          userId,
          subscriptionPlanId: payload.subscriptionPlanId,
          plan: subscriptionPlan.title,
          price: subscriptionPlan.price,
          transactionId: payload.transactionId,


        },
      ],
      { session }
    );
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          subscriptionType: subscriptionPlan.title,
          subscriptionExpiresAt: new Date(Date.now() + subscriptionPlan.durationInDays * 24 * 60 * 60 * 1000),
        },
      },
      { session }
    );


    await session.commitTransaction();
    session.endSession();

    return transaction[0];
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();

    if (err.code === 11000) {
      throw new AppError(httpStatus.CONFLICT, 'Transaction ID already exists');
    }

    throw err;
  }
};

const getAllTransactions = async (
  user: IJwtPayload,
  query: Record<string, unknown>
) => {
  let transactionQuery;
 console.log({ user },"user====");
  // Admin → get all transactions
  if (user.role === USER_ROLE.ADMIN || user.role === USER_ROLE.SUPER_ADMIN) {
    transactionQuery = Transaction.find({})
      .populate({
        path: 'userId',
        select: 'fullName email profileImage role',
      })
      .populate({
        path: 'subscriptionPlanId',
        select: 'title price duration',
      });
  } else {
    // Normal user → only own transactions
    transactionQuery = Transaction.find({ userId: user.userId })
      .populate({
        path: 'subscriptionPlanId',
        select: 'title price duration',
      });
  }

  // QueryBuilder apply
  const qb = new QueryBuilder(transactionQuery, query);
  qb.filter().paginate().fields().sort();

  const [transactions, meta] = await Promise.all([
    qb.modelQuery.lean(),
    qb.countTotal(),
  ]);

  return { transactions, meta };
};
export const subscriptionService = {
  createSubscription,
  getUserSubscriptions,
  getActiveSubscription,
  updateSubscription,
  cancelSubscription,
  getAllSubscriptions,
  checkSubscriptionExpiry,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  getAllSubscriptionPlans,
  createTransaction,
  getAllTransactions
};
