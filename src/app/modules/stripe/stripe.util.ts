import Stripe from 'stripe';
import config from '../../config';
export const stripe = new Stripe(config.stripe.stripe_api_secret!, {
  // @ts-expect-error Stripe types only expose the latest API version.
    apiVersion: '2026-04-22.dahlia',
});

export const calculateAmount = (amount: number) => {
  return Number(amount) * 100;
};