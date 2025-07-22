import { useEffect, useRef } from "react";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

// TODO-MVP: Add standalone offline metronome functionality
// TODO-MVP: Implement haptic feedback patterns for rhythm guidance
// TODO-MVP: Add visual beat indicators and timing feedback

export function useBpmSync(bpm: number, onBeat: () => void) {
  const soundRef = useRef<Audio.Sound>();

  useEffect(() => {
    (async () => {
      soundRef.current = new Audio.Sound();
      await soundRef.current.loadAsync(require("../../assets/metronome.wav"));
      await soundRef.current.setIsLoopingAsync(true);
      await soundRef.current.setVolumeAsync(0); // silent click – visual & haptic only
      await soundRef.current.playAsync();
    })();

    const interval = setInterval(() => {
      onBeat();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, (60_000 / bpm));

    return () => {
      clearInterval(interval);
      soundRef.current?.unloadAsync();
    };
  }, [bpm, onBeat]);
} 