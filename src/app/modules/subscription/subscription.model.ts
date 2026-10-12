import { Schema, model } from 'mongoose';
import { ISubscription } from './subscription.interface';

const subscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
      trim: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'canceled', 'past_due', 'unpaid', 'incomplete'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
      index: true,
    },
    autoRenew: {
      type: Boolean,
      default: true, // auto-renew will be enabled by default upon purchase
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
      index: true,
    },
    cancelAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly filter the user's current active subscription
subscriptionSchema.index({ user: 1, status: 1 });

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);
