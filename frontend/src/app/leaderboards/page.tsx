import React from 'react'
import SectionCard from '@/app/components/SectionCard'

export default function LeaderboardsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Leaderboards</h1>

      <SectionCard title="Filters">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="filter-age" className="block text-sm mb-2">Age</label>
            <select id="filter-age" className="input-field w-full" data-testid="filter-age">
              <option value="all">All</option>
              <option value="under18">Under 18</option>
              <option value="18-35">18-35</option>
              <option value="35+">35+</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-weight" className="block text-sm mb-2">Weight</label>
            <select id="filter-weight" className="input-field w-full" data-testid="filter-weight">
              <option value="all">All</option>
              <option value="light">Light</option>
              <option value="middle">Middle</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-region" className="block text-sm mb-2">Region</label>
            <select id="filter-region" className="input-field w-full" data-testid="filter-region">
              <option value="global">Global</option>
              <option value="na">North America</option>
              <option value="eu">Europe</option>
              <option value="apac">APAC</option>
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Top Ranks">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-gray-300">
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">Athlete</th>
                <th className="px-3 py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((rank) => (
                <tr key={rank} className="border-t border-gray-800">
                  <td className="px-3 py-2">{rank}</td>
                  <td className="px-3 py-2">Athlete {rank}</td>
                  <td className="px-3 py-2">{100 - rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}


