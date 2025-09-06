"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { VideoCapture } from "@/components/VideoCapture";

type Goal = "strength" | "speed" | "endurance";
type Vibe = "encouraging" | "technical" | "direct"; // maps to coaching_style
type Experience = "beginner" | "intermediate" | "advanced"; // maps to strictness seed

type WarmupMove = "squat" | "pushup" | "plank";

function mapExperienceToStrictness(exp: Experience): "balanced" | "strict" | "elite" {
  if (exp === "beginner") return "balanced";
  if (exp === "intermediate") return "strict";
  return "elite";
}

function mapVibeToCoachingStyle(vibe: Vibe): "encouraging" | "technical" | "direct" {
  return vibe;
}

export default function FirstRun() {
  const { data: core, isLoading } = trpc.profile.getCoreSettings.useQuery();
  const updateCore = trpc.profile.updateCoreSettings.useMutation();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [move, setMove] = useState<WarmupMove>("squat");
  const [lastClipUrl, setLastClipUrl] = useState<string | null>(null);

  // Simple overlay drawing while recording
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(168, 85, 247, 0.8)"; // purple
    ctx.lineWidth = 2;
    // Draw crosshair and a baseline depending on movement
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    ctx.beginPath();
    if (move === "squat") {
      ctx.moveTo(0, Math.round(height * 0.7));
      ctx.lineTo(width, Math.round(height * 0.7));
    } else if (move === "pushup") {
      ctx.moveTo(0, Math.round(height * 0.5));
      ctx.lineTo(width, Math.round(height * 0.5));
    } else {
      // plank - neutral band
      ctx.moveTo(0, Math.round(height * 0.6));
      ctx.lineTo(width, Math.round(height * 0.6));
    }
    ctx.stroke();

    rafRef.current = requestAnimationFrame(drawOverlay);
  }, [move]);

  useEffect(() => {
    if (step === 2) {
      rafRef.current = requestAnimationFrame(drawOverlay);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
  }, [step, drawOverlay]);

  useEffect(() => {
    if (!isLoading && core) {
      // Seed defaults from server if any
      // Not overriding user's selections once chosen
      if (!vibe) setVibe((core.coachingStyle as Vibe) ?? "encouraging");
      if (!experience) {
        const s = (core.strictness as "balanced" | "strict" | "elite") ?? "balanced";
        setExperience(s === "balanced" ? "beginner" : s === "strict" ? "intermediate" : "advanced");
      }
    }
  }, [core, isLoading, vibe, experience]);

  const canContinue = useMemo(() => !!goal && !!vibe && !!experience, [goal, vibe, experience]);

  const handleSaveSeeds = async () => {
    if (!core || !vibe || !experience) return;
    await updateCore.mutateAsync({
      units: core.units,
      coachingStyle: mapVibeToCoachingStyle(vibe),
      strictness: mapExperienceToStrictness(experience),
      privacy: core.privacy,
    });
    setStep(2);
  };

  const onCaptureComplete = (metadata: { url: string }) => {
    setLastClipUrl(metadata.url);
    setStep(3);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-8 w-40 bg-gray-700 rounded mb-4" />
        <div className="animate-pulse h-48 bg-gray-800 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Quick Start</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Primary Goal</div>
              <div className="flex flex-wrap gap-2">
                {["strength", "speed", "endurance"].map((g) => (
                  <Button key={g} variant={goal === g ? "default" : "secondary"} onClick={() => setGoal(g as Goal)}>
                    {g as string}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Coaching Vibe</div>
              <div className="flex flex-wrap gap-2">
                {["encouraging", "technical", "direct"].map((v) => (
                  <Button key={v} variant={vibe === v ? "default" : "secondary"} onClick={() => setVibe(v as Vibe)}>
                    {v as string}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Experience</div>
              <div className="flex flex-wrap gap-2">
                {["beginner", "intermediate", "advanced"].map((e) => (
                  <Button key={e} variant={experience === e ? "default" : "secondary"} onClick={() => setExperience(e as Experience)}>
                    {e as string}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={!canContinue || updateCore.status === 'pending'} onClick={handleSaveSeeds}>
              {updateCore.status === 'pending' ? "Saving..." : "Continue"}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Signature Warm-up</h2>
          <div className="flex gap-2">
            {["squat", "pushup", "plank"].map((m) => (
              <Button key={m} variant={move === m ? "default" : "secondary"} onClick={() => setMove(m as WarmupMove)}>
                {m}
              </Button>
            ))}
          </div>
          <div className="relative">
            <VideoCapture
              onComplete={(meta) => onCaptureComplete(meta as any)}
              onError={() => {}}
            />
            <canvas
              ref={canvasRef}
              data-testid="pose-overlay"
              className="pointer-events-none absolute inset-0"
              width={1280}
              height={720}
            />
          </div>
          <div className="text-sm text-muted-foreground">Live overlays guide your form. Record a short clip for each move.</div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Nice! Here’s a quick replay</h2>
          {lastClipUrl ? (
            <video src={lastClipUrl} controls className="w-full max-w-2xl rounded border" />
          ) : (
            <div className="text-sm text-muted-foreground">No clip available.</div>
          )}
          <div className="space-y-2">
            <div className="text-lg font-medium">Mini Leaderboard</div>
            <div className="text-sm text-muted-foreground">Your placement updates after your first full set.</div>
            <div className="rounded border p-3 text-sm">
              <div className="flex items-center justify-between"><span>#1 @alex</span><span>98</span></div>
              <div className="flex items-center justify-between"><span>#2 @sam</span><span>95</span></div>
              <div className="flex items-center justify-between"><span>#3 you</span><span>—</span></div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} variant="secondary">Record another</Button>
          </div>
        </div>
      )}
    </div>
  );
}


