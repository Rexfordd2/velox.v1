"use client"
import React, { useState } from 'react'
import SectionCard from '@/app/components/SectionCard'

export default function LiftToBeatModePage() {
  const [source, setSource] = useState('spotify')
  const [bpm] = useState(120)

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Lift To Beat</h1>

      <SectionCard title="Music Settings">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="music-source" className="block text-sm mb-2">Music Source</label>
            <select
              id="music-source"
              className="input-field w-full"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              data-testid="source-picker"
            >
              <option value="spotify">Spotify</option>
              <option value="apple">Apple Music</option>
              <option value="local">Local Files</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">BPM / Metronome</label>
            <div className="card" data-testid="bpm-display">{bpm} BPM</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Phases">
        <div className="flex gap-2" data-testid="phase-badges">
          <span className="px-3 py-1 rounded-full bg-purple-700/40 border border-purple-500 text-sm">ECC</span>
          <span className="px-3 py-1 rounded-full bg-purple-700/40 border border-purple-500 text-sm">ISO</span>
          <span className="px-3 py-1 rounded-full bg-purple-700/40 border border-purple-500 text-sm">CON</span>
        </div>
      </SectionCard>
    </div>
  )
}


