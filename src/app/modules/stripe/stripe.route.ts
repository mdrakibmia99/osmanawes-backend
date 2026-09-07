import { Router } from "express";
import auth from "../../middleware/auth";
import { stripeController } from "./stripe.controller";
import { USER_ROLE } from "../user/user.constants";

export const stripeRoutes = Router();

stripeRoutes.post('/create-subscription-session',auth(USER_ROLE.USER), stripeController.createSubscriptionSession);
stripeRoutes.get('/payment/confirm-payment', stripeController.confirmSubscriptionPayment);