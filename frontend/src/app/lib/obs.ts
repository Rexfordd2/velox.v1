"use client"
export type VeloxObs = {
  fps: number
  inferenceMs: number
  droppedFrames: number
  uploadQueue: number
  poseConfidence: number
}

declare global {
  interface Window {
    __veloxObs?: VeloxObs
  }
}

const defaultObs: VeloxObs = {
  fps: 60,
  inferenceMs: 16,
  droppedFrames: 0,
  uploadQueue: 0,
  poseConfidence: 0.85,
}

export function initVeloxObs(): VeloxObs | null {
  if (typeof window === 'undefined') return null
  const existing = window.__veloxObs || {}
  // Merge defaults for any missing fields
  window.__veloxObs = {
    fps: typeof (existing as any).fps === 'number' ? (existing as any).fps : defaultObs.fps,
    inferenceMs:
      typeof (existing as any).inferenceMs === 'number' ? (existing as any).inferenceMs : defaultObs.inferenceMs,
    droppedFrames:
      typeof (existing as any).droppedFrames === 'number'
        ? (existing as any).droppedFrames
        : defaultObs.droppedFrames,
    uploadQueue:
      typeof (existing as any).uploadQueue === 'number' ? (existing as any).uploadQueue : defaultObs.uploadQueue,
    poseConfidence:
      typeof (existing as any).poseConfidence === 'number'
        ? (existing as any).poseConfidence
        : defaultObs.poseConfidence,
  }
  return window.__veloxObs
}

export function mockObsTick(partial?: Partial<VeloxObs>): VeloxObs | null {
  if (typeof window === 'undefined') return null
  if (!window.__veloxObs) initVeloxObs()
  if (!window.__veloxObs) return null
  window.__veloxObs = { ...window.__veloxObs, ...(partial || {}) }
  return window.__veloxObs
}


