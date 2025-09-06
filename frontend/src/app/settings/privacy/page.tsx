"use client"
import React, { useState } from 'react'
import SectionCard from '@/app/components/SectionCard'

export default function PrivacySettingsPage() {
  const [isPrivate, setIsPrivate] = useState(true)
  const [cloudVideo, setCloudVideo] = useState(false)

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Privacy Settings</h1>

      <SectionCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Private Account</p>
            <p className="text-sm text-gray-400">Only approved followers can see your activity</p>
          </div>
          <button
            type="button"
            className={`btn-secondary ${isPrivate ? 'bg-purple-700' : ''}`}
            aria-pressed={isPrivate}
            aria-label="Toggle private account"
            data-testid="toggle-private"
            onClick={() => setIsPrivate((v) => !v)}
          >
            {isPrivate ? 'On' : 'Off'}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-300">State: {isPrivate ? 'ON' : 'OFF'}</p>
      </SectionCard>

      <SectionCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Cloud Video Backup</p>
            <p className="text-sm text-gray-400">Store recorded sets in the cloud</p>
          </div>
          <button
            type="button"
            className={`btn-secondary ${cloudVideo ? 'bg-purple-700' : ''}`}
            aria-pressed={cloudVideo}
            aria-label="Toggle cloud video backups"
            data-testid="toggle-cloud-video"
            onClick={() => setCloudVideo((v) => !v)}
          >
            {cloudVideo ? 'On' : 'Off'}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-300">State: {cloudVideo ? 'ON' : 'OFF'}</p>
      </SectionCard>
    </div>
  )
}


