import React from 'react'
import SectionCard from '@/app/components/SectionCard'

type PageProps = { params: { id: string } }

export default function ReplayPage({ params }: PageProps) {
  const { id } = params
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Replay</h1>
      <SectionCard>
        <div data-testid="replay-shell" className="aspect-video rounded-lg bg-gray-800 flex items-center justify-center">
          <span className="text-gray-300">Replay for {id}</span>
        </div>
      </SectionCard>
    </div>
  )
}


