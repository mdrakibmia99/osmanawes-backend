import mongoose from "mongoose";
import config from "../../config";
import { IJwtPayload } from "../auth/auth.interface";
import { SubscriptionPlan, Transaction } from "../subscription/subscription.model";
import { User } from "../user/user.models";
import { calculateAmount, stripe } from "./stripe.util";
import AppError from "../../error/AppError";
import httpStatus from "http-status";
import { SUBSCRIPTION_TYPES } from "../user/user.constants";





// service
const createSubscriptionSession = async (user: IJwtPayload, planId: string) => {

    const userData = await User.findById(user.userId);
    if (!userData) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (userData.subscriptionType !== SUBSCRIPTION_TYPES.FREE) {
        throw new AppError(httpStatus.BAD_REQUEST, 'User already has a subscription');
    }

    const plan = await SubscriptionPlan.findById(planId);

    if (!plan) {
        throw new AppError(httpStatus.NOT_FOUND, 'Subscription plan not found');
    }
    if(plan.price === 0) {
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
                        name: `${plan.title} plan subscription`,
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

        // client_reference_id: `${earnFrom} payment`,
        invoice_creation: {
            enabled: true,
        },
    });

    return paymentGatewayData.url || null;
};

const confirmSubscriptionPayment = async (sessionId: string) => {
    const session: any = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Stripe session data:', session.payment_intent);

    if (session.payment_status !== 'paid') {
        throw new AppError(httpStatus.BAD_REQUEST, 'Payment not completed');
    }
    const userId = session?.metadata.userId as string;
    const planId = session?.metadata.planId as string;
    const paymentIntentId = session.payment_intent as string;
    const subscriptionPlan = await SubscriptionPlan.findById(planId);
    if (!subscriptionPlan) {
        throw new AppError(httpStatus.NOT_FOUND, 'Subscription plan not found');
    }
    const checkTransaction = await Transaction.findOne({ paymentIntentId });
    if (checkTransaction) return
  const userCheck=  await User.findById(userId);
    if (!userCheck) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    if(userCheck.subscriptionType !== SUBSCRIPTION_TYPES.FREE) return

    const transactionData = {
        userId: userId,
        subscriptionPlanId: planId,
        plan: subscriptionPlan.title,
        price: subscriptionPlan.price,
        paymentIntentId: paymentIntentId,
    }
    await Transaction.create(transactionData);
    await User.findByIdAndUpdate(userId, { subscriptionType: subscriptionPlan.title, subscriptionExpiresAt: new Date(Date.now() + subscriptionPlan.durationInDays * 24 * 60 * 60 * 1000) });
    return session
}

export const stripeService = {
    createSubscriptionSession,
    confirmSubscriptionPayment
}