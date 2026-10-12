import { Schema, model } from 'mongoose';
import { IOpeningHour } from './openingHour.interface';

const dayScheduleSchema = new Schema(
  {
    isOpen: {
      type: Boolean,
      default: false,
    },
    startTime: {
      type: String,
      default: '',
    },
    endTime: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const openingHourSchema = new Schema<IOpeningHour>(
  {
    sat: {
      type: dayScheduleSchema,
      default: () => ({ isOpen: false, startTime: '', endTime: '' }),
    },
    sun: {
      type: dayScheduleSchema,
      default: () => ({ isOpen: false, startTime: '', endTime: '' }),
    },
    mon: {
      type: dayScheduleSchema,
      default: () => ({ isOpen: false, startTime: '', endTime: '' }),
    },
    tue: {
      type: dayScheduleSchema,
      default: () => ({ isOpen: false, startTime: '', endTime: '' }),
    },
    wed: {
      type: dayScheduleSchema,
      default: () => ({ isOpen: false, startTime: '', endTime: '' }),
    },
    thu: {
      type: dayScheduleSchema,
      default: () => ({ isOpen: false, startTime: '', endTime: '' }),
    },
    fri: {
      type: dayScheduleSchema,
      default: () => ({ isOpen: false, startTime: '', endTime: '' }),
    },
  },
  {
    timestamps: true,
  }
);

export const OpeningHour = model<IOpeningHour>('OpeningHour', openingHourSchema);
