'use client';

import { useState } from 'react';
import { trpc } from '@/app/_trpc/client';
import { useMemo } from 'react';
import { format } from 'date-fns';
// Use shared ProgressChart wrapper instead of direct recharts import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import ProgressChart from '@/components/ProgressChart';

interface ProgressChartsProps {
  detailed?: boolean;
}

type MetricType = 'form' | 'reps' | 'weight' | 'duration';

export function ProgressCharts({ detailed = false }: ProgressChartsProps) {
  const [selectedExercise, setSelectedExercise] = useState('squat');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('form');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const { data, isLoading, error, refetch } = trpc.workouts.getHistory.useInfiniteQuery(
    { exerciseType: selectedExercise, timeRange, sortBy: 'created_at', sortDir: 'asc', limit: 100 },
    { getNextPageParam: (lastPage) => lastPage?.nextCursor }
  );

  const workouts = useMemo(() => (data?.pages ?? []).flatMap(p => p.items), [data]);

  const processData = (data: typeof workouts) => {
    return data.map(workout => ({
      date: format(new Date(workout.created_at), 'MMM d'),
      form: workout.form_score,
      reps: workout.rep_count,
      duration: workout.duration,
      weight: workout.weight || 0,
    }));
  };

  const chartData = processData(workouts);

  const getMetricColor = (metric: MetricType) => {
    switch (metric) {
      case 'form': return '#10B981';
      case 'reps': return '#6366F1';
      case 'weight': return '#F59E0B';
      case 'duration': return '#EF4444';
      default: return '#10B981';
    }
  };

  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case 'form': return 'Form Score (%)';
      case 'reps': return 'Repetitions';
      case 'weight': return 'Weight (kg)';
      case 'duration': return 'Duration (s)';
      default: return '';
    }
  };

  const renderDetailedView = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <Select value={selectedExercise} onValueChange={setSelectedExercise}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select exercise" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="squat">Squat</SelectItem>
            <SelectItem value="deadlift">Deadlift</SelectItem>
            <SelectItem value="pushup">Push-up</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as 'week' | 'month' | 'year')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="form" className="w-full">
        <TabsList>
          <TabsTrigger value="form">Form Score</TabsTrigger>
          <TabsTrigger value="reps">Repetitions</TabsTrigger>
          <TabsTrigger value="weight">Weight</TabsTrigger>
          <TabsTrigger value="duration">Duration</TabsTrigger>
        </TabsList>

        {(['form', 'reps', 'weight', 'duration'] as MetricType[]).map((metric) => (
          <TabsContent key={metric} value={metric} className="h-[400px]">
            <ProgressChart labels={chartData.map(d => d.date)} values={chartData.map(d => d[metric] as number)} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  const renderOverviewChart = () => (
    <div className="h-[300px]">
      <ProgressChart labels={chartData.map(d => d.date)} values={chartData.map(d => d[selectedMetric] as number)} />
    </div>
  );

  if (isLoading) return <LoadingState variant="detail" />;
  if (error) return <ErrorState onRetry={() => void refetch()} />;
  if (!workouts || workouts.length === 0) return <EmptyState title="No data yet" description="Work out to see your progress here." />;

  return detailed ? renderDetailedView() : renderOverviewChart();
} 