"use client";

import { useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  const { data, isLoading } = trpc.profile.getCoreSettings.useQuery();
  const updateCore = trpc.profile.updateCoreSettings.useMutation();

  useEffect(() => {
    // no-op, ensure initial load
  }, [data]);

  if (isLoading || !data) {
    return <div className="p-6">Loading…</div>;
  }

  const save = async (patch: Partial<typeof data["privacy"]>) => {
    await updateCore.mutateAsync({
      units: data.units,
      coachingStyle: data.coachingStyle as any,
      strictness: data.strictness as any,
      privacy: { ...data.privacy, ...patch },
    });
  };

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-semibold">Privacy</h2>

      <section className="space-y-3">
        <div className="text-lg font-medium">Defaults</div>
        <div className="rounded border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Private by default</div>
              <div className="text-sm text-muted-foreground">Cloud video uploads off; metrics-only sync on</div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={data.privacy.cloudVideo ? "secondary" : "default"}
                onClick={() => save({ cloudVideo: false, metricsOnly: true })}
              >On</Button>
              <Button
                variant={data.privacy.cloudVideo ? "default" : "secondary"}
                onClick={() => save({ cloudVideo: true, metricsOnly: false })}
              >Off</Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Per-share controls</div>
              <div className="text-sm text-muted-foreground">Choose audience when sharing: Me / Coach / Leaderboard</div>
            </div>
            <div className="flex gap-2">
              {(["me", "coach", "leaderboard"] as const).map((aud) => (
                <Button
                  key={aud}
                  variant={data.privacy.defaultAudience === aud ? "default" : "secondary"}
                  onClick={() => save({ defaultAudience: aud })}
                >{aud}</Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div className="text-lg font-medium">Device Attestation</div>
        <div className="text-sm text-muted-foreground">
          To keep bad data off the leaderboards, we verify that your device and app are genuine. This creates a one-time, privacy-preserving proof tied to your device—not your identity—and is checked when submitting scores. It doesn’t give us access to your personal files, and it can’t be used to track you across apps.
        </div>
      </section>
    </div>
  );
}


