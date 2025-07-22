"use client";

import { useQuery } from "@tanstack/react-query";
import getUserProfile from "@/lib/getUserProfile";
import getSavedWorkouts, { type SavedWorkout } from "@/lib/getSavedWorkouts";
import getUserDocuments, { type UserDocument } from "@/lib/getUserDocuments";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import Link from "next/link";

export default function ProfilePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["profile"],
    queryFn: getUserProfile,
  });

  const { data: workouts = [] } = useQuery<SavedWorkout[]>({
    queryKey: ["saved-workouts"],
    queryFn: () => getSavedWorkouts(5),
  });

  const { data: docs = [] } = useQuery<UserDocument[]>({
    queryKey: ["user-docs"],
    queryFn: getUserDocuments,
  });

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-500">Error: {(error as Error).message}</div>;
  if (!data) return <div className="p-6">No profile found.</div>;

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <header className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={data.avatar_url ?? ""} />
          <AvatarFallback>{data.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold">{data.username}</h1>
          <p className="text-sm text-muted-foreground">{data.bio ?? "No bio yet"}</p>
          <p className="text-xs text-primary/60">Music: {data.music_service ?? "None"}</p>
        </div>
      </header>

      <section>
        <h2 className="font-medium mb-2">Goals</h2>
        <pre className="bg-muted p-3 rounded text-xs whitespace-pre-wrap">
{JSON.stringify(data.goals, null, 2)}
        </pre>
      </section>

      {!!data.badges?.length && (
        <section>
          <h2 className="font-medium mb-2">Badges</h2>
          <ul className="flex flex-wrap gap-2">
            {data.badges.map((badge) => (
              <li 
                key={badge.id} 
                className="px-2 py-1 bg-accent rounded text-xs group relative"
                title={badge.description}
              >
                {badge.icon_url && (
                  <img 
                    src={badge.icon_url} 
                    alt="" 
                    className="w-4 h-4 inline-block mr-1" 
                  />
                )}
                {badge.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {!!workouts.length && (
        <section>
          <h2 className="font-medium mb-2">Saved Workouts</h2>
          <ul className="space-y-1 text-sm">
            {workouts.map((workout) => (
              <li key={workout.id} className="flex justify-between">
                <span>{workout.title}</span>
                <span className="text-muted-foreground">
                  {new Date(workout.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!!docs.length && (
        <section>
          <h2 className="font-medium mb-2">Documents</h2>
          <ul className="space-y-1 text-sm">
            {docs.map((doc) => (
              <li key={doc.id}>
                <a
                  href={`https://${
                    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID
                  }.supabase.co/storage/v1/object/public/${doc.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {doc.file_path.split("/").pop()}
                </a>{" "}
                <span className="text-muted-foreground">
                  ({new Date(doc.created_at).toLocaleDateString()})
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href="/dashboard" className="text-sm text-primary underline">
        ← Back to dashboard
      </Link>
    </main>
  );
} 