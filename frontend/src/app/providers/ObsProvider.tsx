"use client"
import React, { useEffect } from 'react'
import { initVeloxObs, mockObsTick } from '../lib/obs'

export default function ObsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initVeloxObs()
    try { (window as any).mockObsTick = mockObsTick } catch {}
    const id = setInterval(() => {
      mockObsTick({
        fps: 58 + Math.random() * 4,
        inferenceMs: 14 + Math.random() * 6,
        droppedFrames: Math.random() < 0.1 ? 1 : 0,
        uploadQueue: Math.random() < 0.05 ? 1 : 0,
        poseConfidence: 0.82 + Math.random() * 0.1,
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])
  return <>{children}</>
}


