import { subscriptionController } from './subscription.controller';
import { model, Schema } from 'mongoose';
import { TTransaction, TransactionModel, ISubscriptionPlan, SubscriptionPlanModel } from './subscription.interface';
import { SUBSCRIPTION_PLANS_ENUM, SUBSCRIPTION_STATUS_ENUM, SUBSCRIPTION_STATUS } from './subscription.constants';

const transactionSchema = new Schema<TTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    subscriptionPlanId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'SubscriptionPlan',
    },
    plan: {
      type: String,
      enum: SUBSCRIPTION_PLANS_ENUM,
      required: true,
    },


    price: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      default: 'stripe',
    },
    paymentIntentId: {
      type: String,
    },

    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

// Indexes for common queries
transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ userId: 1, endDate: 1 });
transactionSchema.index({ status: 1, endDate: 1 });
transactionSchema.index({ transactionId: 1 }, { unique: true, sparse: true });

// Filter out soft-deleted documents if applicable
transactionSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

export const Transaction = model<TTransaction, TransactionModel>(
  'Transaction',
  transactionSchema
);

// =====================
// Subscription Plan Model
// =====================
const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    title: {
      type: String,
      enum: ['free', 'pro', 'premium'],
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
    },
    durationInDays: {
      type: Number,
      default: 30,

    },
    features: [
      {
        type: String,
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

subscriptionPlanSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

export const SubscriptionPlan = model<ISubscriptionPlan, SubscriptionPlanModel>(
  'SubscriptionPlan',
  subscriptionPlanSchema
);
