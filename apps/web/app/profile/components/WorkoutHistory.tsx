'use client';

import { useState } from 'react';
import { trpc } from '@/app/_trpc/client';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';

type SortField = 'date' | 'exercise' | 'score' | 'reps';
type SortOrder = 'asc' | 'desc';

export function WorkoutHistory() {
  const [exerciseFilter, setExerciseFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data: workouts = [], isLoading } = trpc.workouts.getHistory.useQuery({
    exerciseType: exerciseFilter === 'all' ? undefined : exerciseFilter,
    startDate: dateRange.from?.toISOString(),
    endDate: dateRange.to?.toISOString(),
  });

  const sortedWorkouts = [...workouts].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'date':
        return multiplier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'exercise':
        return multiplier * a.exercise_type.localeCompare(b.exercise_type);
      case 'score':
        return multiplier * (a.form_score - b.form_score);
      case 'reps':
        return multiplier * (a.rep_count - b.rep_count);
      default:
        return 0;
    }
  });

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Select value={exerciseFilter} onValueChange={setExerciseFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by exercise" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exercises</SelectItem>
            <SelectItem value="squat">Squat</SelectItem>
            <SelectItem value="deadlift">Deadlift</SelectItem>
            <SelectItem value="pushup">Push-up</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('w-[280px] justify-start text-left font-normal', !dateRange.from && 'text-muted-foreground')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                'Pick a date range'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range: any) => setDateRange(range)}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                Date <SortIcon field="date" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('exercise')}>
                Exercise <SortIcon field="exercise" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('score')}>
                Form Score <SortIcon field="score" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('reps')}>
                Reps <SortIcon field="reps" />
              </TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : sortedWorkouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No workouts found</TableCell>
              </TableRow>
            ) : (
              sortedWorkouts.map((workout) => (
                <TableRow key={workout.id}>
                  <TableCell>{format(new Date(workout.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="capitalize">{workout.exercise_type}</TableCell>
                  <TableCell>{workout.form_score}%</TableCell>
                  <TableCell>{workout.rep_count}</TableCell>
                  <TableCell>{Math.floor(workout.duration / 60)}m {workout.duration % 60}s</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 