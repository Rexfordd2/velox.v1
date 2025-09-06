"use client"
import React, { useEffect, useState } from 'react'
import SectionCard from '@/app/components/SectionCard'
// Access global obs directly to avoid import type mismatches during build
import type { VeloxObs } from '@/app/lib/obs'

export default function DebugStatusPage() {
  const [obs, setObs] = useState<VeloxObs | null>(null)

  useEffect(() => {
    // initial read (safe on client)
    const read = () => (typeof window === 'undefined' ? null : (window as any).__veloxObs ?? null)
    setObs(read())

    // prefer event listener if available; fall back to polling
    const onUpdate = () => setObs(read())
    window.addEventListener?.('velox:obs:update', onUpdate)
    const poll = setInterval(onUpdate, 1000)

    return () => {
      window.removeEventListener?.('velox:obs:update', onUpdate)
      clearInterval(poll)
    }
  }, [])

  const val = (n?: number) =>
    typeof window === 'undefined' ? '--' : (typeof n === 'number' ? Number(n).toFixed(2) : '--')

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Runtime Status</h1>

      <SectionCard title="Observability">
        {!obs ? <p className="text-gray-400">No obs data</p> : null}
        <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm text-gray-400">FPS</dt>
            <dd data-testid="metric-fps" className="text-lg">{val(obs?.fps)}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-400">Inference (ms)</dt>
            <dd data-testid="metric-inference-ms" className="text-lg">{val(obs?.inferenceMs)}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-400">Dropped Frames</dt>
            <dd data-testid="metric-dropped-frames" className="text-lg">{val(obs?.droppedFrames)}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-400">Upload Queue</dt>
            <dd data-testid="metric-upload-queue" className="text-lg">{val(obs?.uploadQueue)}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-400">Pose Confidence</dt>
            <dd data-testid="metric-pose-confidence" className="text-lg">{val(obs?.poseConfidence)}</dd>
          </div>
        </dl>
      </SectionCard>
    </div>
  )
}

