import { Schema, model } from 'mongoose';
import { IPlan } from './plan.interface';

const planSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      enum: {
        values: ['basic', 'pro'],
        message: '{VALUE} is not a valid plan',
      },
      required: true,
    },
    billingCycle: {
      type: String,
      enum: {
        values: ['monthly', 'yearly'],
        message: '{VALUE} is not a valid billing cycle',
      },
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    durationInMonths: {
      type: Number,
      required: true,
      enum: [1, 12],
    },
    stripePriceId: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure the same cycle of the same plan is not duplicated
planSchema.index({ name: 1, billingCycle: 1 }, { unique: true });

export const Plan = model<IPlan>('Plan', planSchema);
