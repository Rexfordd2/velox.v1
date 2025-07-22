"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import useLeaderboard from "@/hooks/useLeaderboard";
import Link from "next/link";

const MOVEMENTS = [
  { id: 'squat', name: 'Squat' },
  { id: 'deadlift', name: 'Deadlift' },
  { id: 'bench', name: 'Bench Press' }
];

export default function LeaderboardPage() {
  const { movementId } = useParams() as { movementId: string };
  const [window, setWindow] = useState<"week" | "month">("week");

  const { data, isLoading, error } = useLeaderboard(
    movementId,
    window,
    "global"
  );

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error)
    return (
      <div className="p-6 text-red-500">Error: {(error as Error).message}</div>
    );

  return (
    <main className="max-w-xl mx-auto p-6">
      {/* Movement selector */}
      <div className="flex gap-3 mb-6">
        {MOVEMENTS.map((movement) => (
          <Link
            key={movement.id}
            href={`/leaderboard/${movement.id}`}
            className={`px-4 py-2 rounded ${
              movementId === movement.id
                ? "bg-primary text-white"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            {movement.name}
          </Link>
        ))}
      </div>

      <h1 className="text-xl font-semibold mb-4 capitalize">
        {MOVEMENTS.find(m => m.id === movementId)?.name || movementId} Leaderboard
      </h1>

      <div className="flex gap-3 mb-4">
        {["week", "month"].map((w) => (
          <button
            key={w}
            onClick={() => setWindow(w as "week" | "month")}
            className={`px-3 py-1 rounded ${
              window === w ? "bg-primary text-white" : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      <ol className="space-y-3">
        {data?.map((row) => (
          <li 
            key={row.user_id} 
            className="flex justify-between items-center bg-gray-800 p-3 rounded"
          >
            <div className="flex items-center gap-3">
              <span className={`
                ${row.rank === 1 ? 'text-yellow-400' : 
                  row.rank === 2 ? 'text-gray-400' : 
                  row.rank === 3 ? 'text-amber-700' : 'text-gray-500'}
                font-bold
              `}>
                #{row.rank}
              </span>
              <span>{row.username}</span>
            </div>
            <span className="font-medium text-primary">{row.best_score}%</span>
          </li>
        ))}
      </ol>
    </main>
  );
} 