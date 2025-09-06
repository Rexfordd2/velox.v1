import React from 'react'

type Point = { date: string; value: number | null }

interface Props {
  data: Point[]
  width?: number
  height?: number
}

export default function TrendsSparkline({ data, width = 120, height = 36 }: Props) {
  const padding = 4
  const values = data.map(d => d.value).filter((v): v is number => typeof v === 'number')
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 0
  const span = max - min || 1

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2)
    const y = height - padding - (((d.value ?? min) - min) / span) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  const last = values.at(-1) ?? 0
  const prev = values.at(-2) ?? last
  const delta = last - prev
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '▬'
  const arrowColor = delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#9ca3af'

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <polyline
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          points={points}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span style={{ color: arrowColor, fontSize: 12 }}>{arrow}</span>
    </div>
  )
}


