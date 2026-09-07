import { HydratedDocument, Model, Schema, Types } from 'mongoose';
import { SUBSCRIPTION_PLANS_INTERFACE, SUBSCRIPTION_STATUS_INTERFACE } from './subscription.constants';

export interface TSubscriptionCreate {
  userId: Schema.Types.ObjectId | string;
  plan: SUBSCRIPTION_PLANS_INTERFACE;
  status?: SUBSCRIPTION_STATUS_INTERFACE;
  startDate: Date;
  endDate: Date;
  price: number;
  currency?: string;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
}

export interface TSubscriptionUpdate {
  plan: SUBSCRIPTION_PLANS_INTERFACE;
  status: SUBSCRIPTION_STATUS_INTERFACE;
  notes: string;
}

export interface TTransaction extends TSubscriptionCreate {
  _id: string;
  subscriptionPlanId: Schema.Types.ObjectId | string;
  paymentIntentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionModel extends Model<TTransaction> {
  isActiveSubscription(userId: string): Promise<TTransaction | null>;
  getUserSubscriptions(userId: string): Promise<TTransaction[]>;
}

// =====================
// Subscription Plan Interface
// =====================
export interface ISubscriptionPlan {
  title: 'free' | 'pro' | 'premium';
  stripePriceId:string
  description: string;
  price: number;
  durationInDays: number;
  features: string[];
  isActive: boolean;
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlanModel extends Model<ISubscriptionPlan> {
  getActivePlans(): Promise<ISubscriptionPlan[]>;
}
