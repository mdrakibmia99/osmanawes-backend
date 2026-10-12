import { Router } from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { subscriptionController } from './subscription.controller';
import { subscriptionValidation } from './subscription.validation';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

// ==========================================
// Plan Routes
// ==========================================

// Public / Authenticated: Get active plans (Cached with Redis)
router.get('/plans', subscriptionController.getActivePlans);

// Admin: Get all plans (including inactive ones)
router.get(
  '/plans/all',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  subscriptionController.getAllPlans,
);

// Admin: Create subscription plan
router.post(
  '/plans',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  validateRequest(subscriptionValidation.createPlanSchema),
  subscriptionController.createPlan,
);

// Admin: Update subscription plan
router.patch(
  '/plans/:id',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  validateRequest(subscriptionValidation.updatePlanSchema),
  subscriptionController.updatePlan,
);

// Admin: Delete subscription plan
router.delete(
  '/plans/:id',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  subscriptionController.deletePlan,
);

// ==========================================
// Subscription Routes
// ==========================================

// User / Business: Get own active subscription (Cached with Redis)
router.get(
  '/my-subscription',
  auth(USER_ROLE.USER, USER_ROLE.BUSINESS, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  subscriptionController.getMyActiveSubscription,
);

// Admin: Create / Assign subscription to a user or business
router.post(
  '/admin/create',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  validateRequest(subscriptionValidation.adminCreateSubscriptionSchema),
  subscriptionController.adminCreateSubscription,
);

// Admin: Update an existing subscription
router.patch(
  '/admin/:id',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  validateRequest(subscriptionValidation.adminUpdateSubscriptionSchema),
  subscriptionController.adminUpdateSubscription,
);

// Admin: List all subscriptions with search, filter, and pagination
router.get(
  '/all',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  subscriptionController.getAllSubscriptions,
);

// Admin: Get single subscription by ID
router.get(
  '/:id',
  auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  subscriptionController.getSubscriptionById,
);

export const subscriptionRoutes = router;
