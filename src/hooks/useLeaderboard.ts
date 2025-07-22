import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "../lib/trpc-native";

export function useLeaderboard(movement: string) {
  const [range, setRange] = useState<"week" | "month">("week");
  const [scope, setScope] = useState<"global" | "friends">("global");

  const queryKey = ["lb", movement, scope, range] as const;

  const query = useQuery({
    queryKey,
    queryFn: () =>
      scope === "global"
        ? trpc.leaderboards.getGlobal.query({ movement, window: range })
        : trpc.leaderboards.getFriends.query({ movement, window: range }),
  });

  return { ...query, range, setRange, scope, setScope };
} 