import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { subscriptionService } from './subscription.service';
import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { IJwtPayload } from '../auth/auth.interface';

const createSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.createSubscription(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Subscription created successfully',
    data: result,
  });
});

const getMySubscriptions = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const result = await subscriptionService.getUserSubscriptions(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'my current subscription plan',
    data: result,
  });
});

const getActiveSubscription = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const result = await subscriptionService.getActiveSubscription(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Active subscription fetched successfully',
    data: result,
  });
});

const updateSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.updateSubscription(
    req.params.id as any,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription updated successfully',
    data: result,
  });
});

const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const result = await subscriptionService.cancelSubscription(
    req.params.id as any,
    userId,
    req.body?.reason
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription cancelled successfully',
    data: result,
  });
});

const getAllSubscriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.getAllSubscriptions(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All subscriptions fetched successfully',
    data: result.result,
    meta: result.meta,
  });
});



// =====================
// Subscription Plan Controllers
// =====================
const createSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.createSubscriptionPlan(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Subscription plan created successfully',
    data: result,
  });
});

const updateSubscriptionPlan = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.updateSubscriptionPlan(
    req.params.id as any,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan updated successfully',
    data: result,
  });
});

const getAllSubscriptionPlans = catchAsync(async (req: Request, res: Response) => {
  console.log('Fetching all subscription plans');
  const result = await subscriptionService.getAllSubscriptionPlans();
  console.log('Transaction created:', result);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plans fetched successfully',
    data: result,
  });
});
const createTransaction = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.createTransaction(req.user.userId, req.body);


  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Transaction created successfully',
    data: result,
  });
});
const getAllTransactions = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.getAllTransactions(req.user as IJwtPayload, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Transactions fetched successfully',
    data: result,
  });
});

export const subscriptionController = {
  createSubscription,
  getMySubscriptions,
  getActiveSubscription,
  updateSubscription,
  cancelSubscription,
  getAllSubscriptions,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  getAllSubscriptionPlans,
  createTransaction,
  getAllTransactions
};
