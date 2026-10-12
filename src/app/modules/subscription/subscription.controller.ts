import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { subscriptionService } from './subscription.service';

// ==========================================
// Plan Controllers
// ==========================================

const createPlan = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.createPlan(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Subscription plan created successfully',
    data: result,
  });
});

const getActivePlans = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.getActivePlans();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Active subscription plans retrieved successfully',
    data: result,
  });
});

const getAllPlans = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.getAllPlans(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All subscription plans retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updatePlan = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await subscriptionService.updatePlan(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan updated successfully',
    data: result,
  });
});

const deletePlan = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await subscriptionService.deletePlan(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan deleted successfully',
    data: result,
  });
});

// ==========================================
// Subscription Controllers
// ==========================================

const adminCreateSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.adminCreateSubscription(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Subscription created for user successfully by admin',
    data: result,
  });
});

const adminUpdateSubscription = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await subscriptionService.adminUpdateSubscription(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription updated successfully',
    data: result,
  });
});

const getAllSubscriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await subscriptionService.getAllSubscriptions(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All subscriptions retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getMyActiveSubscription = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const result = await subscriptionService.getMyActiveSubscription(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Active subscription retrieved successfully',
    data: result,
  });
});

const getSubscriptionById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await subscriptionService.getSubscriptionById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription retrieved successfully',
    data: result,
  });
});

export const subscriptionController = {
  createPlan,
  getActivePlans,
  getAllPlans,
  updatePlan,
  deletePlan,
  adminCreateSubscription,
  adminUpdateSubscription,
  getAllSubscriptions,
  getMyActiveSubscription,
  getSubscriptionById,
};
