import { buildTimeline, chooseAudioPolicy, type FfmpegAdapter, type GenerateReelOptions } from "../src/generator";

class DummyAdapter implements FfmpegAdapter {
  async exportMp4(): Promise<Uint8Array> {
    return new Uint8Array([1, 2, 3]);
  }
}

describe("replay generator", () => {
  test("buildTimeline creates beat grid within tolerance and caps captions to 2", () => {
    const bpm = 120; // 0.5s per beat
    const metrics = {
      bpm,
      videoDurationSeconds: 60,
      startAtSeconds: 10,
      coachingTips: ["Drive through heels", "Keep core tight", "Third tip should be dropped"],
    };

    const timeline = buildTimeline(metrics, 20);

    // Duration should be clamped to requested 20s
    expect(Math.abs((timeline.end - timeline.start) - 20)).toBeLessThanOrEqual(1e-6);

    // Beats roughly every 0.5s within [start, end]
    const beatInterval = 60 / bpm;
    for (let i = 1; i < timeline.beats.length; i++) {
      const delta = timeline.beats[i].time - timeline.beats[i - 1].time;
      expect(Math.abs(delta - beatInterval)).toBeLessThan(1e-6 + 1e-3);
    }

    // Captions limited to 2
    expect(timeline.captions.length).toBeLessThanOrEqual(2);
  });

  test("audio policy: streaming source replaced or muted; velox kept tempo-locked", async () => {
    const adapter = new DummyAdapter();
    const shared = {
      metrics: { bpm: 100, videoDurationSeconds: 30 },
      videoSource: "video.mp4",
      ffmpegAdapter: adapter,
    } as Partial<GenerateReelOptions>;

    const streamingReplace = chooseAudioPolicy({ sourceType: "streaming", policy: "replace" });
    expect(streamingReplace.action).toBe("replace");
    expect(streamingReplace.tempoLocked).toBe(false);

    const streamingMute = chooseAudioPolicy({ sourceType: "streaming", policy: "mute" });
    expect(streamingMute.action).toBe("mute");

    const veloxKeep = chooseAudioPolicy({ sourceType: "velox" });
    expect(veloxKeep.action).toBe("keep");
    expect(veloxKeep.tempoLocked).toBe(true);
  });
});


