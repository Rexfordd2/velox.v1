import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Animated, Switch } from "react-native";
import { Camera as ExpoCamera, CameraType } from "expo-camera";
import Svg, { Circle } from "react-native-svg";
import { usePoseDetector, PoseStatus } from "../hooks/usePoseDetector";
import { useVelocity } from "../hooks/useVelocity";
import { saveSet } from "../lib/saveSet";
import type { Keypoint } from "@tensorflow-models/pose-detection";

export default function RecordSetScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [peak, setPeak] = useState(0);
  const [avgConfidence, setAvgConfidence] = useState(0);
  const cameraRef = useRef<typeof ExpoCamera>(null);
  const { estimate, state: poseState, toggleAdaptiveMode } = usePoseDetector();
  const velocity = useVelocity();
  const [showPerformance, setShowPerformance] = useState(true);
  const performanceOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const { status } = await ExpoCamera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(performanceOpacity, {
        toValue: 0.3,
        duration: 500,
        useNativeDriver: true,
      }).start();
      setShowPerformance(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const togglePerformance = () => {
    setShowPerformance(!showPerformance);
    Animated.timing(performanceOpacity, {
      toValue: !showPerformance ? 1 : 0.3,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const onFrame = async () => {
    const frame = await cameraRef.current?.takePictureAsync({ skipProcessing: true });
    if (!frame) return;

    const poses = await estimate(frame);
    if (!poses[0]) return;

    const wrists = poses[0].keypoints.filter((k: Keypoint) => k.name?.includes("wrist"));
    if (wrists.length === 2) {
      const y = (wrists[0].y + wrists[1].y) / 2;
      const v = Math.abs(velocity.addSample(y));
      setPeak((p) => Math.max(p, v));
      setAvgConfidence(poses[0].score || 0);
    }
  };

  const handleSave = async () => {
    await saveSet("squat", peak);
    alert("Set saved! Peak m/s: " + peak.toFixed(2));
    setPeak(0);
  };

  // Performance monitoring UI
  const renderPerformanceMetrics = () => {
    if (!poseState.modelLoaded) return null;

    const { performance, fps, targetFps, status, brightness } = poseState;
    const statusColor = {
      [PoseStatus.OK]: '#4CAF50',
      [PoseStatus.LOW_FPS]: '#FF9800',
      [PoseStatus.LOST_TRACKING]: '#F44336',
      [PoseStatus.ERROR]: '#F44336',
      [PoseStatus.ADJUSTING]: '#2196F3'
    }[status];

    const getMetricColor = (value: number, threshold: number, inverse = false) => {
      return inverse 
        ? value > threshold ? '#F44336' : '#4CAF50'
        : value < threshold ? '#F44336' : '#4CAF50';
    };

    const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
      switch (trend) {
        case 'increasing': return '↑';
        case 'decreasing': return '↓';
        case 'stable': return '→';
      }
    };

    const getStabilityColor = (score: number) => {
      if (score > 0.8) return '#4CAF50';
      if (score > 0.6) return '#FF9800';
      return '#F44336';
    };

    return (
      <Animated.View 
        style={[
          styles.performanceContainer,
          { opacity: performanceOpacity }
        ]}
      >
        <TouchableOpacity 
          style={styles.performanceHeader}
          onPress={togglePerformance}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusText}>
            {status} {showPerformance ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {showPerformance && (
          <View style={styles.metricsContainer}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>FPS / Target</Text>
              <Text style={[
                styles.metricValue,
                { color: getMetricColor(fps, targetFps * 0.9) }
              ]}>
                {fps.toFixed(1)} / {targetFps}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Process Time</Text>
              <Text style={[
                styles.metricValue,
                { color: getMetricColor(performance.avgProcessingTime, 16, true) }
              ]}>
                {performance.avgProcessingTime.toFixed(1)}ms
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Device Load</Text>
              <View style={styles.metricWithTrend}>
                <Text style={[
                  styles.metricValue,
                  { color: getMetricColor(performance.deviceLoad * 100, 80, true) }
                ]}>
                  {(performance.deviceLoad * 100).toFixed(1)}%
                </Text>
                <Text style={[
                  styles.trendIcon,
                  { color: performance.loadTrend === 'stable' ? '#FFF' : getMetricColor(performance.loadTrend === 'increasing', true, true) }
                ]}>
                  {getTrendIcon(performance.loadTrend)}
                </Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Stability</Text>
              <Text style={[
                styles.metricValue,
                { color: getStabilityColor(performance.stabilityScore) }
              ]}>
                {(performance.stabilityScore * 100).toFixed(1)}%
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Prediction</Text>
              <Text style={[
                styles.metricValue,
                { color: getMetricColor(performance.predictionAccuracy * 100, 90) }
              ]}>
                {(performance.predictionAccuracy * 100).toFixed(1)}%
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Smoothing</Text>
              <Text style={[
                styles.metricValue,
                { color: getMetricColor(performance.smoothingLatency, 5, true) }
              ]}>
                {performance.smoothingLatency.toFixed(1)}ms
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Adaptive FPS</Text>
              <Switch
                value={performance.adaptiveModeEnabled}
                onValueChange={toggleAdaptiveMode}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={performance.adaptiveModeEnabled ? '#2196F3' : '#f4f3f4'}
              />
            </View>

            <Text style={styles.helpText}>
              {performance.adaptiveModeEnabled 
                ? `Auto-adjusting FPS for ${performance.loadTrend} load`
                : 'Fixed FPS mode enabled'}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  if (hasPermission === null) return <Text>Requesting camera…</Text>;
  if (hasPermission === false) return <Text>No camera access</Text>;

  return (
    <View style={styles.container}>
      <ExpoCamera
        ref={cameraRef}
        style={styles.camera}
        type={CameraType.BACK}
        onCameraReady={() => {
          if (cameraRef.current) {
            cameraRef.current.onFrameProcessed = onFrame;
          }
        }}
      />
      {renderPerformanceMetrics()}
      <View style={styles.metrics}>
        <Text style={styles.velocityText}>
          Velocity: {peak.toFixed(2)} m/s
          <Text style={{ marginLeft: 8 }}>
            {avgConfidence > 0.8 ? "🟢" : avgConfidence > 0.5 ? "🟡" : "🔴"}
          </Text>
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Set</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    margin: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  metrics: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  velocityText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  performanceContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  metricsContainer: {
    padding: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginRight: 12,
  },
  metricValue: {
    color: 'white',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  controlLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  helpText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  metricWithTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: 'bold',
  },
}); 