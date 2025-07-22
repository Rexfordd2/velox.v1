import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import Stripe from 'stripe';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const webhooksRouter = router({
  stripeWebhook: publicProcedure
    .input(z.object({ rawBody: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const sig = ctx.req.headers['stripe-signature'];
        if (!sig) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No Stripe signature found',
          });
        }

        const event = stripe.webhooks.constructEvent(
          input.rawBody,
          sig,
          webhookSecret
        );

        const { supabase } = ctx;

        switch (event.type) {
          case 'customer.subscription.created':
          case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            // Get subscription tier from metadata or price
            const tier = subscription.items.data[0].price.nickname || 'basic';

            // Update user's subscription status
            await supabase
              .from('profiles')
              .update({
                subscription_tier: tier,
                subscription_status: subscription.status,
                subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq('stripe_customer_id', customerId);

            break;
          }

          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            // Remove subscription data
            await supabase
              .from('profiles')
              .update({
                subscription_tier: null,
                subscription_status: 'inactive',
                subscription_period_end: null,
              })
              .eq('stripe_customer_id', customerId);

            break;
          }

          case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;

            // Update subscription status
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'past_due',
              })
              .eq('stripe_customer_id', customerId);

            // TODO: Send notification to user about failed payment
            break;
          }

          case 'customer.deleted': {
            const customer = event.data.object as Stripe.Customer;

            // Clear customer data
            await supabase
              .from('profiles')
              .update({
                stripe_customer_id: null,
                subscription_tier: null,
                subscription_status: null,
                subscription_period_end: null,
              })
              .eq('stripe_customer_id', customer.id);

            break;
          }
        }

        return { received: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Webhook handler failed',
          cause: error,
        });
      }
    }),
}); 