import React from 'react'
import SectionCard from '@/app/components/SectionCard'

type PageProps = { params: { id: string } }

export default function VerifyPage({ params }: PageProps) {
  const { id } = params
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Verify</h1>
      <SectionCard>
        <div className="space-y-4">
          <div data-testid="verify-shell" className="aspect-video rounded-lg bg-gray-800 flex items-center justify-center">
            <span className="text-gray-300">Verify attempt {id}</span>
          </div>
          <div className="aspect-video rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center">
            <span className="text-gray-500">Second angle placeholder</span>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}


