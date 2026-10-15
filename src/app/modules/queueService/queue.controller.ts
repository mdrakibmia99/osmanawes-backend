import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { queueService } from './queue.service';

const updateQueue = catchAsync(async (req: Request, res: Response) => {
  const result = await queueService.updateQueue(req?.user?.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Queue updated successfully',
    data: result,
  });
});

export const queueController = {
  updateQueue,
};
