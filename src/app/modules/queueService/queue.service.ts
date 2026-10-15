import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { IQueue } from './queue.interface';
import { Queue } from './queue.model';

const updateQueue = async (
  businessId: string,
  payload: Partial<Omit<IQueue, '_id' | 'businessId' | 'createdAt' | 'updatedAt'>>,
) => {
  const queue = await Queue.findOneAndUpdate(
    { businessId },
    { $set: payload },
    { new: true, runValidators: true },
  );

  if (!queue) {
    throw new AppError(httpStatus.NOT_FOUND, 'Queue not found');
  }

  return queue;
};

export const queueService = {
  updateQueue,
};
