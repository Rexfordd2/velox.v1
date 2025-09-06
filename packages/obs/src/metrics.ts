// Lightweight global metrics store for OBS-style runtime telemetry
// Provides a subscribe/getSnapshot API plus React hook for consumption

import { useSyncExternalStore } from 'react';

export type SessionSyncState = 'pending' | 'partial' | 'complete';

export interface UploadQueueStatus {
  pending: number;
  retries: number;
}

export interface ObsMetrics {
  fps: number | null;
  poseInferenceMs: number | null;
  droppedFramesPct: number | null; // 0-100
  poseConfidenceAvg: number | null; // 0-1
  uploadQueue: UploadQueueStatus;
  sessionSync: SessionSyncState;
  networkMbps: number | null;
}

type Listener = () => void;

class MetricsStore {
  private state: ObsMetrics = {
    fps: null,
    poseInferenceMs: null,
    droppedFramesPct: null,
    poseConfidenceAvg: null,
    uploadQueue: { pending: 0, retries: 0 },
    sessionSync: 'pending',
    networkMbps: null,
  };

  private listeners: Set<Listener> = new Set();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): ObsMetrics => this.state;

  private emit() {
    for (const listener of this.listeners) listener();
  }

  private update(patch: Partial<ObsMetrics>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  // Setters for modules to publish values
  setFps = (fps: number | null) => this.update({ fps });

  setPoseInferenceMs = (ms: number | null) => this.update({ poseInferenceMs: ms });

  setDroppedFramesPct = (pct: number | null) => this.update({ droppedFramesPct: pct });

  setPoseConfidenceAvg = (avg: number | null) => this.update({ poseConfidenceAvg: avg });

  setUploadQueue = (pending: number, retries: number) =>
    this.update({ uploadQueue: { pending, retries } });

  setSessionSync = (state: SessionSyncState) => this.update({ sessionSync: state });

  setNetworkMbps = (mbps: number | null) => this.update({ networkMbps: mbps });

  reset = () => {
    this.state = {
      fps: null,
      poseInferenceMs: null,
      droppedFramesPct: null,
      poseConfidenceAvg: null,
      uploadQueue: { pending: 0, retries: 0 },
      sessionSync: 'pending',
      networkMbps: null,
    };
    this.emit();
  };
}

export const metricsStore = new MetricsStore();

export function useObsMetrics() {
  const snapshot = useSyncExternalStore(metricsStore.subscribe, metricsStore.getSnapshot, metricsStore.getSnapshot);
  return {
    metrics: snapshot,
    // re-expose setters for publishers
    setFps: metricsStore.setFps,
    setPoseInferenceMs: metricsStore.setPoseInferenceMs,
    setDroppedFramesPct: metricsStore.setDroppedFramesPct,
    setPoseConfidenceAvg: metricsStore.setPoseConfidenceAvg,
    setUploadQueue: metricsStore.setUploadQueue,
    setSessionSync: metricsStore.setSessionSync,
    setNetworkMbps: metricsStore.setNetworkMbps,
    reset: metricsStore.reset,
  };
}

export type { ObsMetrics as ObsMetricsState };


