'use client';

import { trpc } from '@/app/_trpc/client';
import { format } from 'date-fns';
import { Trophy, TrendingUp, Timer, Dumbbell } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

export function PersonalBests() {
  const { data: personalBests, isLoading, error, refetch } = trpc.workouts.getPersonalBests.useQuery();

  const renderMetricCard = (
    title: string,
    value: string | number,
    date: string,
    icon: React.ReactNode,
    color: string
  ) => (
    <div className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50">
      <div className={`p-2 rounded-full ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
        <p className="text-xs text-gray-400">
          Achieved {format(new Date(date), 'MMM d, yyyy')}
        </p>
      </div>
    </div>
  );

  if (isLoading) return <LoadingState lines={3} />;
  if (error) return <ErrorState onRetry={() => void refetch()} />;

  if (!personalBests) return <EmptyState title="No personal bests yet" description="Complete workouts to start tracking PBs." />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {personalBests.map((exercise) => (
        <div key={exercise.type} className="space-y-4">
          <h3 className="font-semibold capitalize">{exercise.type}</h3>
          <div className="space-y-3">
            {exercise.bestFormScore && (
              renderMetricCard(
                'Best Form Score',
                `${exercise.bestFormScore}%`,
                exercise.bestFormScoreDate,
                <Trophy className="w-5 h-5 text-yellow-500" />,
                'bg-yellow-100'
              )
            )}
            {exercise.maxReps && (
              renderMetricCard(
                'Most Reps',
                exercise.maxReps,
                exercise.maxRepsDate,
                <TrendingUp className="w-5 h-5 text-blue-500" />,
                'bg-blue-100'
              )
            )}
            {exercise.bestDuration && (
              renderMetricCard(
                'Longest Duration',
                `${Math.floor(exercise.bestDuration / 60)}m ${exercise.bestDuration % 60}s`,
                exercise.bestDurationDate,
                <Timer className="w-5 h-5 text-green-500" />,
                'bg-green-100'
              )
            )}
            {exercise.maxWeight && (
              renderMetricCard(
                'Max Weight',
                `${exercise.maxWeight}kg`,
                exercise.maxWeightDate,
                <Dumbbell className="w-5 h-5 text-purple-500" />,
                'bg-purple-100'
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 