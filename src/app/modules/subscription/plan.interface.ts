import { Types } from 'mongoose';

export type TPlanName = 'basic' | 'pro';
export type TBillingCycle = 'monthly' | 'yearly';

export interface IPlan {
  _id?: Types.ObjectId | string;
  name: TPlanName;
  billingCycle: TBillingCycle;
  price: number;
  originalPrice: number;
  durationInMonths: 1 | 12;
  stripePriceId: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
