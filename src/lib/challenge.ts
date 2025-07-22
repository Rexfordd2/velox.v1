import supabase from "../lib/supabase-native";

interface ChallengePayload {
  id: string;
  challenger_id: string;
  opponent_id: string;
  movement: string;
  created_at: string;
}

export async function createChallenge(opponentId: string, movement = "squat") {
  const { error } = await supabase.rpc("create_challenge", {
    opponent_id: opponentId,
    movement,
  });
  if (error) throw error;
}

export function subscribeChallenges(onNew: (payload: any) => void) {
  return supabase
    .channel("challenges")
    .on("broadcast", { event: "new_challenge" }, ({ payload }) => onNew(payload))
    .subscribe();
} 