import { Types } from 'mongoose';

export type TSubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'unpaid'
  | 'incomplete';

export interface ISubscription {
  _id?: Types.ObjectId | string;
  user: Types.ObjectId | string;
  plan: Types.ObjectId | string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: TSubscriptionStatus;
  autoRenew: boolean;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAdminCreateSubscriptionPayload {
  userId: string;
  planId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status?: TSubscriptionStatus;
  autoRenew?: boolean;
  currentPeriodStart?: string | Date;
  currentPeriodEnd?: string | Date;
}
