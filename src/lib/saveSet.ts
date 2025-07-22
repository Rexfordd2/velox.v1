import supabase from "@/lib/supabase-native";

export async function saveSet(movement: string, bestScore: number) {
  const { error } = await supabase
    .from("movement_scores")
    .insert({ movement_id: movement, score: bestScore });
  if (error) throw error;
} 