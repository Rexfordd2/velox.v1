'use client';

import { useState } from 'react';
import { trpc } from '@/app/_trpc/client';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProgressChartsProps {
  detailed?: boolean;
}

type MetricType = 'form' | 'reps' | 'weight' | 'duration';

export function ProgressCharts({ detailed = false }: ProgressChartsProps) {
  const [selectedExercise, setSelectedExercise] = useState('squat');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('form');
  const [timeRange, setTimeRange] = useState('month');

  const { data: workouts = [], isLoading } = trpc.workouts.getHistory.useQuery({
    exerciseType: selectedExercise,
    timeRange,
  });

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

        <Select value={timeRange} onValueChange={setTimeRange}>
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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke={getMetricColor(metric)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={getMetricLabel(metric)}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  const renderOverviewChart = () => (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={selectedMetric}
            stroke={getMetricColor(selectedMetric)}
            strokeWidth={2}
            dot={{ r: 4 }}
            name={getMetricLabel(selectedMetric)}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  if (isLoading) {
    return <div className="text-center py-8">Loading progress data...</div>;
  }

  return detailed ? renderDetailedView() : renderOverviewChart();
} 