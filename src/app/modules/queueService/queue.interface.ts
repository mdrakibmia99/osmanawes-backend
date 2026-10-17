import { Types } from 'mongoose';

export interface IQueue {
  _id?: Types.ObjectId | string;
  acceptReserVationStatus: boolean;
  businessId: Types.ObjectId | string;
  maxCapacity: number;
  waitTime: number;
  skipPassPrice: number;
  queueStatus: boolean;
  totalTable: number;
  totalTableBook: number;
  passBenefit: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
