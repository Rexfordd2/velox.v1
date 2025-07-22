import { useState, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Camera } from "expo-camera";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import * as Sharing from "expo-sharing";
import { usePoseDetector } from "../../hooks/usePoseDetector";
import { useBpmSync } from "../../hooks/useBpmSync";
import { useVelocity } from "../../hooks/useVelocity";
import type { Keypoint } from "@tensorflow-models/pose-detection";
import supabase from "../../lib/supabase-native";

// Scoring algorithm from music-sync package
const calculateTimingScore = (timings: { diffMs: number }[]) => {
  if (!timings.length) return 0;
  const maxDiff = 250; // ms
  const scores = timings.map(t => Math.max(0, 1 - t.diffMs / maxDiff));
  return Math.round((scores.reduce((a, b) => a + b, 0) / timings.length) * 100);
};

export default function GameScreen() {
  const cameraRef = useRef<Camera>(null);
  const [permission, requestPerm] = Camera.useCameraPermissions();
  const { estimate } = usePoseDetector();
  const velocity = useVelocity();

  const [phase, setPhase] = useState<"ready" | "record" | "done">("ready");
  const [flash, setFlash] = useState(false);
  const [beatTimings, setBeatTimings] = useState<{ diffMs: number }[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const bpm = 120;

  // metronome
  useBpmSync(bpm, () => {
    if (phase === "record") {
      setFlash(true);
      setCurrentBeat(b => b + 1);
    }
    setTimeout(() => setFlash(false), 80);
  });

  // lightweight polling loop
  const onFrame = async () => {
    if (phase !== "record") return;
    const frame = await cameraRef.current?.takePictureAsync({ skipProcessing: true });
    if (!frame) return;

    const poses = await estimate(frame);
    const wrists = poses[0]?.keypoints.filter((k: Keypoint) => k.name?.includes("wrist"));
    if (wrists?.length === 2) {
      // simple rep detection: positive velocity peak
      const y = (wrists[0].y + wrists[1].y) / 2;
      const v = velocity.addSample(y);
      if (v > 1.0) {
        const now = Date.now();
        const beatMs = 60_000 / bpm;
        const diff = Math.abs((now % beatMs) - beatMs);
        setBeatTimings(b => [...b, { diffMs: diff }]);
      }
    }
  };

  const start = () => {
    setPhase("record");
    requestPerm();
    setTimeout(() => {
      setPhase("done");
      const finalScore = Math.round(calculateTimingScore(beatTimings));
      setScore(finalScore);
      saveScore(finalScore, beatTimings.length);
    }, 15_000);
  };

  const saveScore = async (finalScore: number, reps: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("beat_scores")
      .insert({
        user_id: user.id,
        bpm,
        score: finalScore,
        reps,
      });
  };

  const shareResult = useCallback(async () => {
    if (score === null) return;
    const message = `🏋️‍♂️ Just scored ${score} points lifting to the beat!\n` +
      `${beatTimings.length} reps at ${bpm} BPM\n` +
      `#VeloxFitness`;
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(message);
    }
  }, [score, beatTimings.length, bpm]);

  if (!permission?.granted)
    return <TouchableOpacity onPress={requestPerm}><Text>Grant camera</Text></TouchableOpacity>;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Camera ref={cameraRef} style={{ flex: 1 }} onCameraReady={() => setInterval(onFrame, 350)} />
      
      <Svg style={styles.overlay} pointerEvents="none">
        {/* Beat counter */}
        <SvgText
          x="50%"
          y="15%"
          fontSize="24"
          fill="#fff"
          textAnchor="middle"
        >
          {currentBeat}
        </SvgText>
        
        {/* Rep counter */}
        <SvgText
          x="50%"
          y="22%"
          fontSize="18"
          fill="#4ade80"
          textAnchor="middle"
        >
          {beatTimings.length} reps
        </SvgText>
      </Svg>

      {flash && <View style={styles.flash} pointerEvents="none" />}
      
      {phase === "ready" && (
        <TouchableOpacity style={styles.btn} onPress={start}>
          <Text style={styles.btnTxt}>Start</Text>
        </TouchableOpacity>
      )}
      
      {phase === "done" && (
        <View style={styles.result}>
          <Text style={styles.resultTxt}>Score: {score}</Text>
          <Text style={styles.resultSub}>Reps: {beatTimings.length}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={shareResult}>
            <Text style={styles.shareTxt}>Share Result</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: "#ffffff70" },
  overlay: { ...StyleSheet.absoluteFillObject },
  btn: {
    position: "absolute", top: "45%", alignSelf: "center",
    backgroundColor: "#4ade80", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 8,
  },
  btnTxt: { fontSize: 20, fontWeight: "600" },
  result: { position: "absolute", bottom: 80, alignSelf: "center", alignItems: "center" },
  resultTxt: { color: "#fff", fontSize: 30, fontWeight: "700" },
  resultSub: { color: "#fff", fontSize: 16, marginTop: 4 },
  shareBtn: {
    backgroundColor: "#4ade80",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  shareTxt: { color: "#000", fontWeight: "600" },
}); 