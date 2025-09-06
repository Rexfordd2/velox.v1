'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateChallengePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [exercise, setExercise] = useState('squat');
  const [metric, setMetric] = useState('meanConVel');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder create flow; wire to API later
    router.push('/challenges');
  }

  return (
    <div className="container mx-auto max-w-xl py-8">
      <h1 className="text-2xl font-semibold">Create Challenge</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="BYLS: Bench speed PR"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Exercise</label>
          <select className="mt-1 w-full rounded border px-3 py-2" value={exercise} onChange={(e) => setExercise(e.target.value)}>
            <option value="squat">Squat</option>
            <option value="bench">Bench</option>
            <option value="deadlift">Deadlift</option>
            <option value="row">Row</option>
            <option value="ohp">OHP</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Metric</label>
          <select className="mt-1 w-full rounded border px-3 py-2" value={metric} onChange={(e) => setMetric(e.target.value)}>
            <option value="meanConVel">Mean Concentric Velocity</option>
            <option value="peakConVel">Peak Concentric Velocity</option>
            <option value="romM">Range of Motion</option>
            <option value="powerW">Power (W)</option>
          </select>
        </div>
        <button className="rounded bg-blue-600 px-4 py-2 text-white" type="submit">Create</button>
      </form>
    </div>
  );
}


