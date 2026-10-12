import { Schema, model } from 'mongoose';
import { IQueue } from './queue.interface';

const queueSchema = new Schema<IQueue>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    maxCapacity: {
      type: Number,
      default: 0,
    },
    waitTime: {
      type: Number,
      default: 0, // wait time in minutes
    },
    skipPassPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Queue = model<IQueue>('Queue', queueSchema);
