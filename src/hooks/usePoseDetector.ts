import { useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import * as posedetection from "@tensorflow-models/pose-detection";
import { Camera } from "expo-camera";

// Must call this once in app root (Expo)
tf.enableProdMode();

export function usePoseDetector() {
  const detectorRef = useRef<posedetection.PoseDetector>();

  useEffect(() => {
    (async () => {
      await tf.ready();
      detectorRef.current = await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet
      );
    })();
    return () => detectorRef.current?.dispose();
  }, []);

  /** estimate poses for a given camera texture or HTMLCanvasElement */
  const estimate = async (image: posedetection.PoseDetectorInput) => {
    if (!detectorRef.current) return [];
    return detectorRef.current.estimatePoses(image, { flipHorizontal: false });
  };

  return { estimate };
} 