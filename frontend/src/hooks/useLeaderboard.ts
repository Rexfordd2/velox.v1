import { useQuery } from "@tanstack/react-query";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  best_score: number;
  rank: number;
}

// Mock leaderboard data
const mockLeaderboardData: Record<string, LeaderboardEntry[]> = {
  squat: [
    { user_id: 'user-1', username: 'demo_user', best_score: 95, rank: 1 },
    { user_id: 'user-2', username: 'fitness_pro', best_score: 92, rank: 2 },
    { user_id: 'user-3', username: 'gym_enthusiast', best_score: 88, rank: 3 },
    { user_id: 'user-4', username: 'strength_coach', best_score: 85, rank: 4 },
    { user_id: 'user-5', username: 'power_lifter', best_score: 82, rank: 5 }
  ],
  deadlift: [
    { user_id: 'user-2', username: 'fitness_pro', best_score: 94, rank: 1 },
    { user_id: 'user-1', username: 'demo_user', best_score: 91, rank: 2 },
    { user_id: 'user-5', username: 'power_lifter', best_score: 89, rank: 3 },
    { user_id: 'user-3', username: 'gym_enthusiast', best_score: 86, rank: 4 },
    { user_id: 'user-4', username: 'strength_coach', best_score: 83, rank: 5 }
  ],
  bench: [
    { user_id: 'user-4', username: 'strength_coach', best_score: 96, rank: 1 },
    { user_id: 'user-2', username: 'fitness_pro', best_score: 93, rank: 2 },
    { user_id: 'user-1', username: 'demo_user', best_score: 89, rank: 3 },
    { user_id: 'user-5', username: 'power_lifter', best_score: 87, rank: 4 },
    { user_id: 'user-3', username: 'gym_enthusiast', best_score: 84, rank: 5 }
  ]
};

export default function useLeaderboard(
  movementId: string,
  window: "week" | "month",
  scope: "global" | "friends" = "global"
) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", movementId, window, scope],
    queryFn: async () => {
      // Return mock data based on movement ID
      return mockLeaderboardData[movementId] || [];
    },
  });
} 