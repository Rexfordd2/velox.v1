'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useObsMetrics } from '@velox/obs'

function Stat({ label, value, suffix }: { label: string; value: string | number | null; suffix?: string }) {
  const display = value === null || value === undefined || value === '' ? '—' : `${value}${suffix ?? ''}`
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{display}</div>
    </div>
  )
}

export default function DebugStatusPage() {
  const { metrics } = useObsMetrics()

  // Derived safe displays
  const fps = useMemo(() => metrics.fps != null ? Number(metrics.fps.toFixed(1)) : null, [metrics.fps])
  const poseMs = useMemo(() => metrics.poseInferenceMs != null ? Math.round(metrics.poseInferenceMs) : null, [metrics.poseInferenceMs])
  const dropPct = useMemo(() => metrics.droppedFramesPct != null ? Number(metrics.droppedFramesPct.toFixed(1)) : null, [metrics.droppedFramesPct])
  const conf = useMemo(() => metrics.poseConfidenceAvg != null ? Number(metrics.poseConfidenceAvg.toFixed(3)) : null, [metrics.poseConfidenceAvg])
  const net = useMemo(() => metrics.networkMbps != null ? Number(metrics.networkMbps.toFixed(2)) : null, [metrics.networkMbps])

  // Optional synthetic network estimation via downlink (if available)
  const [navDownlink, setNavDownlink] = useState<number | null>(null)
  useEffect(() => {
    const conn: any = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    const read = () => setNavDownlink(conn?.downlink ?? null)
    read()
    if (conn && typeof conn.addEventListener === 'function') {
      conn.addEventListener('change', read)
      return () => conn.removeEventListener('change', read)
    }
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Runtime Status</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Stat label="FPS" value={fps} />
        <Stat label="Pose inference" value={poseMs} suffix=" ms" />
        <Stat label="Dropped frames" value={dropPct} suffix=" %" />
        <Stat label="Pose confidence (avg)" value={conf} />
        <Stat label="Upload queue" value={metrics.uploadQueue?.pending ?? 0} />
        <Stat label="Retries" value={metrics.uploadQueue?.retries ?? 0} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Session sync" value={metrics.sessionSync} />
        <Stat label="Network (reported)" value={net} suffix=" Mbps" />
        <Stat label="Network (navigator)" value={navDownlink} suffix=" Mbps" />
      </div>

      <div className="text-xs text-muted-foreground">
        Publish metrics via the `useObsMetrics()` setters from modules like capture, pose, upload, and session syncing.
      </div>
    </div>
  )
}


