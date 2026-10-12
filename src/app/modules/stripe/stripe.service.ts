import mongoose from "mongoose";
import config from "../../config";
import { IJwtPayload } from "../auth/auth.interface";
import { Plan } from "../subscription/plan.model";
import { Subscription } from "../subscription/subscription.model";
import { User } from "../user/user.models";
import { calculateAmount, stripe } from "./stripe.util";
import AppError from "../../error/AppError";
import httpStatus from "http-status";

// service
const createSubscriptionSession = async (user: IJwtPayload, planId: string) => {
    const userData = await User.findById(user.userId);
    if (!userData) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    const plan = await Plan.findById(planId);

    if (!plan) {
        throw new AppError(httpStatus.NOT_FOUND, 'Subscription plan not found');
    }
    if (plan.price === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Cannot create subscription session for free plan');
    }

    const paymentGatewayData = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${plan.name} (${plan.billingCycle}) plan subscription`,
                    },
                    unit_amount: calculateAmount(plan.price),
                },
                quantity: 1,
            },
        ],
        metadata: {
            userId: user.userId.toString(),
            planId: planId.toString(),
        },
        success_url: `${config.server_url}/api/v1/stripe/payment/confirm-payment?sessionId={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.server_url}/api/v1/stripe/payments/cancel?paymentId=${'paymentDummy'}`,
        invoice_creation: {
            enabled: true,
        },
    });

    return paymentGatewayData.url || null;
};

const confirmSubscriptionPayment = async (sessionId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session: any = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Stripe session data:', session.payment_intent);

    if (session.payment_status !== 'paid') {
        throw new AppError(httpStatus.BAD_REQUEST, 'Payment not completed');
    }
    const userId = session?.metadata?.userId as string;
    const planId = session?.metadata?.planId as string;
    const paymentIntentId = session.payment_intent as string;
    const plan = await Plan.findById(planId);
    if (!plan) {
        throw new AppError(httpStatus.NOT_FOUND, 'Subscription plan not found');
    }

    const checkSubscription = await Subscription.findOne({ stripeSubscriptionId: paymentIntentId });
    if (checkSubscription) return;

    const userCheck = await User.findById(userId);
    if (!userCheck) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date(currentPeriodStart);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + (plan.durationInMonths || 1));

    const newSubscription = await Subscription.create({
        user: userId,
        plan: planId,
        stripeCustomerId: (session.customer as string) || 'cus_placeholder',
        stripeSubscriptionId: paymentIntentId,
        status: 'active',
        autoRenew: true,
        currentPeriodStart,
        currentPeriodEnd,
    });

    await User.findByIdAndUpdate(userId, { subscriptionId: newSubscription._id });
    return session;
};

export const stripeService = {
    createSubscriptionSession,
    confirmSubscriptionPayment,
};