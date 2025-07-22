import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const SUBSCRIPTION_TIERS = {
  BASIC: {
    id: 'basic',
    price: 'price_basic', // Replace with actual Stripe price ID
    features: ['AI Form Analysis', 'Basic Tracking'],
  },
  PRO: {
    id: 'pro',
    price: 'price_pro', // Replace with actual Stripe price ID
    features: ['AI Form Analysis', 'Advanced Tracking', 'Spotify Integration'],
  },
  ELITE: {
    id: 'elite',
    price: 'price_elite', // Replace with actual Stripe price ID
    features: ['All Pro Features', 'Priority Support', 'Custom Training Plans'],
  },
} as const;

export const paymentsRouter = router({
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        priceId: z.string(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { user, supabase } = ctx;

        // Get or create Stripe customer
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', user.id)
          .single();

        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: {
              supabase_user_id: user.id,
            },
          });
          customerId = customer.id;

          // Save Stripe customer ID
          await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id);
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [
            {
              price: input.priceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          automatic_tax: { enabled: true },
        });

        return { sessionId: session.id };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create checkout session',
          cause: error,
        });
      }
    }),

  getSubscriptionTiers: protectedProcedure.query(async () => {
    return SUBSCRIPTION_TIERS;
  }),

  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const { user, supabase } = ctx;

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_tier')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return null;
    }

    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return null;
      }

      const subscription = subscriptions.data[0];
      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        tier: profile.subscription_tier,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch subscription',
        cause: error,
      });
    }
  }),

  cancelSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await stripe.subscriptions.update(input.subscriptionId, {
          cancel_at_period_end: true,
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel subscription',
          cause: error,
        });
      }
    }),

  createPortalSession: protectedProcedure
    .input(z.object({ returnUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const { user, supabase } = ctx;

      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No subscription found',
        });
      }

      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: profile.stripe_customer_id,
          return_url: input.returnUrl,
        });

        return { url: session.url };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create portal session',
          cause: error,
        });
      }
    }),
}); 