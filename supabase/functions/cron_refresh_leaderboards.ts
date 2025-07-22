import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { buildLeaderboard } from '../../../packages/core/leaderboard.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  try {
    // Only allow POST requests
    if (req.method === 'POST') {
      // Create Supabase client
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Get all movements
      const { data: movements, error: movementsError } = await supabaseClient
        .from('movements')
        .select('id');

      if (movementsError) {
        throw new Error(`Failed to fetch movements: ${movementsError.message}`);
      }

      // Process each movement
      for (const movement of movements) {
        try {
          // Build global leaderboards for both time windows
          const timeWindows = ['week', 'month'] as const;
          
          for (const window of timeWindows) {
            const leaderboard = await buildLeaderboard({
              movementId: movement.id,
              window,
              scope: 'global',
              userId: '', // Not needed for global scope
            });

            // Upsert into cache
            await supabaseClient
              .from('leaderboards_cache')
              .upsert({
                movement_id: movement.id,
                window,
                scope: 'global',
                generated_for: null,
                payload: leaderboard,
                created_at: new Date().toISOString(),
              }, {
                onConflict: 'movement_id,window,scope,generated_for',
              });
          }
        } catch (error) {
          console.error(`Failed to process movement ${movement.id}:`, error);
          // Continue with next movement
          continue;
        }
      }

      // Cleanup old cache entries (keep last 24 hours)
      await supabaseClient
        .from('leaderboards_cache')
        .delete()
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      return new Response(
        JSON.stringify({ message: 'Leaderboards refreshed successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response('Method not allowed', {
      headers: { ...corsHeaders },
      status: 405,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 