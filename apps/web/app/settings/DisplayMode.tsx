"use client";

import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export default function DisplayMode() {
  const { data, isLoading } = trpc.profile.getCoreSettings.useQuery();
  const updateCore = trpc.profile.updateCoreSettings.useMutation();

  const density = useMemo(() => {
    // Simple vs Pro: map to strictness and overlay detail as a proxy
    // Simple → balanced; Pro → strict
    const s = data?.strictness ?? "balanced";
    return s === "balanced" ? "simple" : "pro";
  }, [data]);

  if (isLoading || !data) return <div className="p-6">Loading…</div>;

  const setMode = async (mode: "simple" | "pro") => {
    await updateCore.mutateAsync({
      units: data.units,
      coachingStyle: data.coachingStyle as any,
      strictness: mode === "simple" ? "balanced" : "strict",
      privacy: data.privacy,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-semibold">Display Mode</h2>
      <div className="rounded border p-4 flex items-center justify-between">
        <div>
          <div className="font-medium">Simple vs Pro</div>
          <div className="text-sm text-muted-foreground">Switches UI density and overlay detail</div>
        </div>
        <div className="flex gap-2">
          <Button variant={density === "simple" ? "default" : "secondary"} onClick={() => setMode("simple")}>
            Simple
          </Button>
          <Button variant={density === "pro" ? "default" : "secondary"} onClick={() => setMode("pro")}>
            Pro
          </Button>
        </div>
      </div>
    </div>
  );
}


