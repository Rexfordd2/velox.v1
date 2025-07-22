import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

const createChallengeSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  movementId: z.string().uuid(),
  participantId: z.string().uuid(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

export const challengesRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createChallengeSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;
      const { title, description, movementId, participantId, endDate } = input;

      // Start a transaction
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          creator_id: user.id,
          title,
          description,
          movement_id: movementId,
          end_date: new Date(endDate).toISOString(),
        })
        .select()
        .single();

      if (challengeError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create challenge',
          cause: challengeError,
        });
      }

      // Add participants (creator and opponent)
      const { error: participantsError } = await supabase
        .from('challenge_participants')
        .insert([
          {
            challenge_id: challenge.id,
            user_id: user.id,
            status: 'accepted',
          },
          {
            challenge_id: challenge.id,
            user_id: participantId,
            status: 'pending',
          },
        ]);

      if (participantsError) {
        // Rollback challenge creation
        await supabase
          .from('challenges')
          .delete()
          .eq('id', challenge.id);

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add participants',
          cause: participantsError,
        });
      }

      // Fetch the complete challenge data with participants
      const { data: fullChallenge, error: fetchError } = await supabase
        .from('challenges')
        .select(`
          *,
          movement:movements (
            id,
            name
          ),
          participants:challenge_participants (
            user:users (
              id,
              username,
              avatar_url
            ),
            status
          )
        `)
        .eq('id', challenge.id)
        .single();

      if (fetchError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch challenge details',
          cause: fetchError,
        });
      }

      // Create notification in database
      await supabase
        .from('notifications')
        .insert({
          user_id: participantId,
          type: 'challenge_received',
          content: `${user.email} challenged you to ${fullChallenge.movement.name}!`,
          data: {
            challengeId: challenge.id,
            movementId,
            challengerName: user.email,
          },
        });

      // Send realtime notification through database changes
      // This will trigger the client's subscription to the notifications table
      const channel = supabase.channel('challenges');
      await channel.send({
        type: 'broadcast',
        event: 'new_challenge',
        payload: {
          type: 'new_challenge',
          challenge: fullChallenge,
        },
      });

      return fullChallenge;
    }),
}); 