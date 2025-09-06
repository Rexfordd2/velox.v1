"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Timeline = {
  start: number;
  end: number;
  bpm: number;
  beats: { time: number; index: number }[];
  captions: { time: number; text: string; duration: number }[];
};

export default function ReplayPage({ params }: { params: { repId: string } }) {
  const search = useSearchParams();
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const repId = params.repId;
  const videoUrl = useMemo(() => search.get("video") ?? "", [search]);

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Replay #{repId}</h1>
      <div className="aspect-video w-full rounded-md border overflow-hidden bg-black">
        {videoUrl ? (
          <video src={videoUrl} className="w-full h-full" controls playsInline />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-500">Provide ?video=URL</div>
        )}
      </div>

      {timeline ? (
        <div className="rounded-md border p-3 text-sm">
          <div>Duration: {(timeline.end - timeline.start).toFixed(2)}s</div>
          <div>BPM: {timeline.bpm}</div>
          <div>Beats: {timeline.beats.length}</div>
          <div>Captions: {timeline.captions.length}</div>
        </div>
      ) : null}
    </div>
  );
}


