import { Router } from 'express';
import { userRoutes } from '../modules/user/user.route';
import { authRoutes } from '../modules/auth/auth.route';
import { otpRoutes } from '../modules/otp/otp.routes';
import { notificationRoutes } from '../modules/notifications/notifications.route';
import { SettingRoutes } from '../modules/Setting/setting.route';
import { adminRoutes } from '../modules/Admin/admin.route';
import { openAiRoutes } from '../modules/openai/openai.route';
import { subscriptionRoutes } from '../modules/subscription/subscription.route';
import { stripeRoutes } from '../modules/stripe/stripe.route';




const router = Router();

const moduleRoutes = [
  {
    path: '/users',
    route: userRoutes,
  },
  {
    path: '/admin',
    route: adminRoutes,
  },

  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/otp',
    route: otpRoutes,
  },

  {
    path: '/notifications',
    route: notificationRoutes,
  },

  {
    path: '/setting',
    route: SettingRoutes,
  },




  {
    path: '/openai',
    route: openAiRoutes,
  },

  {
    path: '/subscriptions',
    route: subscriptionRoutes,
  },

  {
    path: '/stripe',
    route: stripeRoutes,
  }

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
