import { Router } from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { subscriptionController } from './subscription.controller';
import { subscriptionValidation } from './subscription.validation';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

// User routes
router.get(
  '/my-subscriptions',
  auth(USER_ROLE.USER),
  subscriptionController.getMySubscriptions
);

router.get(
  '/active',
  auth(USER_ROLE.USER),
  subscriptionController.getActiveSubscription
);

router.post(
  '/cancel/:id',
  auth(USER_ROLE.USER),
  validateRequest(subscriptionValidation.cancelSubscriptionSchema),
  subscriptionController.cancelSubscription
);

// Admin routes
router.post(
  '/create',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  validateRequest(subscriptionValidation.createSubscriptionSchema),
  subscriptionController.createSubscription
);

router.patch(
  '/update/:id',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  validateRequest(subscriptionValidation.updateSubscriptionSchema),
  subscriptionController.updateSubscription
);



router.get(
  '/all',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  subscriptionController.getAllSubscriptions
);

// =====================
// Subscription Plan Routes
// =====================
router.post(
  '/plan/create',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  validateRequest(subscriptionValidation.createSubscriptionPlanSchema),
  subscriptionController.createSubscriptionPlan
);

router.patch(
  '/plan/update/:id',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  validateRequest(subscriptionValidation.updateSubscriptionPlanSchema),
  subscriptionController.updateSubscriptionPlan
);

router.get(
  '/plans',
  subscriptionController.getAllSubscriptionPlans
);

router.post(
  '/transaction',
  auth(USER_ROLE.USER),
  // validateRequest(subscriptionValidation.createTransactionSchema),
  subscriptionController.createTransaction
);

router.get(
  '/transactions',
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  subscriptionController.getAllTransactions
);


export const subscriptionRoutes = router;
