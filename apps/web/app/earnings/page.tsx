'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { evaluateTier, tierLabel, computeRevenueSplit } from '@velox/sponsor';

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className="w-full h-2 bg-gray-200 rounded">
      <div className="h-2 bg-green-500 rounded" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function EarningsPage() {
  // Stubbed metrics; wire to backend later
  const sample = {
    windowDays: 45,
    avgFormQualityPct: 82,
    totalPoints: 720,
    verifiedWins: 2,
    top3Placements: 6,
    sportsmanshipPct: 92,
  };

  const evalResult = useMemo(() => evaluateTier(sample), []);
  const split = useMemo(() => computeRevenueSplit(1234.56, evalResult.tier), [evalResult.tier]);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Earnings & Sponsorship</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-2">
          <div className="text-sm text-gray-500">Current Tier</div>
          <div className="text-2xl font-semibold">{tierLabel(evalResult.tier)}</div>
          {evalResult.nextTarget && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Progress to {tierLabel(evalResult.nextTarget.tier)}</div>
              <ProgressBar value={evalResult.progress.overall} />
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-2">
          <div className="text-sm text-gray-500">This Month</div>
          <div className="text-2xl font-semibold">${split.creatorUsd.toFixed(2)}</div>
          <div className="text-xs text-gray-500">You {Math.round(split.creatorPct * 100)}% · Platform {Math.round(split.platformPct * 100)}%</div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="text-sm text-gray-500">Affiliate</div>
          <div className="text-2xl font-semibold">12 signups</div>
          <div className="text-xs text-gray-500">Conversion 3.4% · Payout $84.00</div>
        </Card>
      </div>

      <Card className="p-4 space-y-4">
        <h2 className="text-xl font-semibold">Tier Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-sm mb-1"><span>Form Quality</span><span>{Math.round(sample.avgFormQualityPct)}%</span></div>
            <ProgressBar value={evalResult.progress.form} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1"><span>Points</span><span>{sample.totalPoints}</span></div>
            <ProgressBar value={evalResult.progress.points} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1"><span>Verified Wins</span><span>{sample.verifiedWins}</span></div>
            <ProgressBar value={evalResult.progress.verified} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1"><span>Top 3 Placements</span><span>{sample.top3Placements}</span></div>
            <ProgressBar value={evalResult.progress.placements} />
          </div>
          <div className="md:col-span-2">
            <div className="flex justify-between text-sm mb-1"><span>Sportsmanship</span><span>{sample.sportsmanshipPct}%</span></div>
            <ProgressBar value={evalResult.progress.sportsmanship} />
          </div>
        </div>
      </Card>

      <Tabs defaultValue="offers">
        <TabsList>
          <TabsTrigger value="offers">Brand Offers</TabsTrigger>
          <TabsTrigger value="affiliate">Affiliate</TabsTrigger>
          <TabsTrigger value="history">Payouts</TabsTrigger>
        </TabsList>
        <TabsContent value="offers">
          <Card className="p-4 space-y-2">
            <div className="text-sm text-gray-500">Offers</div>
            <div className="text-gray-600">Integration pending. Connect with partner brands to receive exclusive offers based on your tier.</div>
            <Button className="w-fit" disabled>Connect Brands (coming soon)</Button>
          </Card>
        </TabsContent>
        <TabsContent value="affiliate">
          <Card className="p-4 space-y-2">
            <div className="text-sm text-gray-500">Affiliate Link</div>
            <div className="flex items-center gap-2">
              <code className="px-2 py-1 bg-gray-100 rounded">https://velox.fit/a/you</code>
              <Button size="sm" disabled>Copy</Button>
            </div>
            <div className="text-sm text-gray-500">Last 30 days: 1,234 clicks · 12 signups · $84.00</div>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card className="p-4 space-y-2">
            <div className="text-sm text-gray-500">Payout History</div>
            <div className="text-gray-600">No payouts yet.</div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


