'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useSessionTracker } from '@/hooks/useSessionTracker';
import { WorkoutSession } from '@/lib/services/sessionTracker';

function SessionDetails({ session }: { session: WorkoutSession }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Session Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Reps</dt>
                <dd className="text-2xl font-bold">{session.summary?.totalReps}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Average Velocity</dt>
                <dd className="text-2xl font-bold">{session.summary?.avgVelocity.toFixed(2)} m/s</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Average ROM</dt>
                <dd className="text-2xl font-bold">{session.summary?.avgROM.toFixed(1)}°</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Average Confidence</dt>
                <dd className="text-2xl font-bold">{(session.summary?.avgConfidence || 0).toFixed(1)}%</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Set Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Set</TableHead>
                  <TableHead>Reps</TableHead>
                  <TableHead>Avg Vel</TableHead>
                  <TableHead>Fatigue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.summary?.sets.map((set, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{set.totalReps}</TableCell>
                    <TableCell>{set.avgVelocity.toFixed(2)}</TableCell>
                    <TableCell>{set.fatigueIndex.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rep Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rep</TableHead>
                <TableHead>Velocity</TableHead>
                <TableHead>ROM</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {session.reps.map((rep, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{rep.velocity.calibrated.toFixed(2)}</TableCell>
                  <TableCell>{rep.rom.toFixed(1)}°</TableCell>
                  <TableCell>{rep.confidenceScore.toFixed(1)}%</TableCell>
                  <TableCell>{rep.feedback?.join(', ') || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProgressPage() {
  const { recentSessions } = useSessionTracker();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const handleExport = async (session: WorkoutSession) => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${session.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workout History</h1>
        <p className="text-gray-500">Track your progress and review past sessions</p>
      </div>

      <div className="space-y-4">
        {recentSessions.map(session => (
          <Card key={session.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{session.exerciseName}</CardTitle>
                  <CardDescription>
                    {format(session.startTime, 'PPp')} • {session.summary?.totalReps} reps
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleExport(session)}
                >
                  Export
                </Button>
              </div>
            </CardHeader>

            <Accordion
              type="single"
              value={expandedSession}
              onValueChange={setExpandedSession}
            >
              <AccordionItem value={session.id}>
                <AccordionTrigger className="px-6">
                  View Details
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <SessionDetails session={session} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        ))}
      </div>
    </div>
  );
} 