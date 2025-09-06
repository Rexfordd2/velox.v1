"use client"
import React, { useState } from 'react'
import SectionCard from '@/app/components/SectionCard'

export default function OnboardingPage() {
  const [goal, setGoal] = useState<string | null>(null)
  const [vibe, setVibe] = useState<string | null>(null)
  const [experience, setExperience] = useState<string | null>(null)

  const handleStart = () => {
    // Intentional console.log for spec stub
    // eslint-disable-next-line no-console
    console.log('start_warmup_clicked', { goal, vibe, experience })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Onboarding</h1>

      <SectionCard title="Select Your Preferences">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm mb-2">Goal</label>
            <div className="flex gap-2" data-testid="goal-choice">
              <button
                type="button"
                className={`btn-secondary ${goal === 'strength' ? 'bg-purple-700' : ''}`}
                aria-pressed={goal === 'strength'}
                onClick={() => setGoal('strength')}
              >
                Strength
              </button>
              <button
                type="button"
                className={`btn-secondary ${goal === 'hypertrophy' ? 'bg-purple-700' : ''}`}
                aria-pressed={goal === 'hypertrophy'}
                onClick={() => setGoal('hypertrophy')}
              >
                Hypertrophy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Vibe</label>
            <div className="flex gap-2" data-testid="vibe-choice">
              <button
                type="button"
                className={`btn-secondary ${vibe === 'chill' ? 'bg-purple-700' : ''}`}
                aria-pressed={vibe === 'chill'}
                onClick={() => setVibe('chill')}
              >
                Chill
              </button>
              <button
                type="button"
                className={`btn-secondary ${vibe === 'hype' ? 'bg-purple-700' : ''}`}
                aria-pressed={vibe === 'hype'}
                onClick={() => setVibe('hype')}
              >
                Hype
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Experience</label>
            <div className="flex gap-2" data-testid="experience-choice">
              <button
                type="button"
                className={`btn-secondary ${experience === 'beginner' ? 'bg-purple-700' : ''}`}
                aria-pressed={experience === 'beginner'}
                onClick={() => setExperience('beginner')}
              >
                Beginner
              </button>
              <button
                type="button"
                className={`btn-secondary ${experience === 'advanced' ? 'bg-purple-700' : ''}`}
                aria-pressed={experience === 'advanced'}
                onClick={() => setExperience('advanced')}
              >
                Advanced
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button type="button" className="btn-primary" data-testid="start-warmup" onClick={handleStart}>
            Start Warmup
          </button>
        </div>
      </SectionCard>
    </div>
  )
}


