import { Types } from 'mongoose';

export interface IQueue {
  _id?: Types.ObjectId | string;
  businessId: Types.ObjectId | string;
  maxCapacity: number;
  waitTime: number;
  skipPassPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}
