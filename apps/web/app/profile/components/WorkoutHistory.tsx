'use client';

import { useState } from 'react';
import { trpc } from '@/app/_trpc/client';
import { useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
// Lightweight table primitives fallback
const Table = ({ children }: { children: React.ReactNode }) => <table className="w-full text-left text-sm">{children}</table>;
const TableBody = ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>;
const TableCell = ({ children, colSpan, className }: { children: React.ReactNode; colSpan?: number; className?: string }) => <td colSpan={colSpan} className={`py-2 px-3 ${className || ''}`}>{children}</td>;
const TableHead = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => <th onClick={onClick} className={`py-2 px-3 ${className || ''}`}>{children}</th>;
const TableHeader = ({ children }: { children: React.ReactNode }) => <thead><tr className="border-b">{children}</tr></thead>;
const TableRow = ({ children }: { children: React.ReactNode }) => <tr className="border-b">{children}</tr>;
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// Simple placeholders for calendar/popover
const Calendar = (props: any) => <div className="p-4 text-sm text-gray-500">Calendar unavailable</div>;
const Popover = ({ children, ..._props }: { children: React.ReactNode }) => <div>{children}</div>;
const PopoverTrigger = ({ children, ..._props }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>;
const PopoverContent = ({ children, ..._props }: { children: React.ReactNode; className?: string; align?: string }) => <div className="p-2 border rounded bg-white text-black">{children}</div>;
const cn = (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' ');
import { CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

type SortField = 'date' | 'exercise' | 'score' | 'reps';
type SortOrder = 'asc' | 'desc';

export function WorkoutHistory() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [exerciseFilter, setExerciseFilter] = useState(searchParams.get('exercise') || 'all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>(() => {
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    return {
      from: fromStr ? new Date(fromStr) : undefined,
      to: toStr ? new Date(toStr) : undefined,
    };
  });
  const [sortField, setSortField] = useState<SortField>((searchParams.get('sortBy') as SortField) || 'date');
  const [sortOrder, setSortOrder] = useState<SortOrder>((searchParams.get('sortDir') as SortOrder) || 'desc');

  // Persist in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (exerciseFilter && exerciseFilter !== 'all') params.set('exercise', exerciseFilter); else params.delete('exercise');
    if (dateRange.from) params.set('from', dateRange.from.toISOString()); else params.delete('from');
    if (dateRange.to) params.set('to', dateRange.to.toISOString()); else params.delete('to');
    params.set('sortBy', sortField);
    params.set('sortDir', sortOrder);
    const next = `${window.location.pathname}?${params.toString()}`;
    router.replace(next);
  }, [exerciseFilter, dateRange.from, dateRange.to, sortField, sortOrder, router]);

  const sortByColumn = useMemo(() => {
    switch (sortField) {
      case 'date': return 'created_at' as const;
      case 'exercise': return 'exercise_type' as const;
      case 'score': return 'form_score' as const;
      case 'reps': return 'rep_count' as const;
      default: return 'created_at' as const;
    }
  }, [sortField]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = trpc.workouts.getHistory.useInfiniteQuery(
    {
      exerciseType: exerciseFilter === 'all' ? undefined : exerciseFilter,
      startDate: dateRange.from?.toISOString(),
      endDate: dateRange.to?.toISOString(),
      sortBy: sortByColumn,
      sortDir: sortOrder,
      limit: 50,
    },
    {
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
    }
  );

  const workouts = useMemo(() => (data?.pages ?? []).flatMap(p => p.items), [data]);

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
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center"><LoadingState variant="inline" /></TableCell>
              </TableRow>
            )}
            {!isLoading && error && (
              <TableRow>
                <TableCell colSpan={5} className="text-center"><ErrorState onRetry={() => void refetch()} /></TableCell>
              </TableRow>
            )}
            {!isLoading && !error && workouts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center"><EmptyState title="No workouts found" description="Try a different filter or date range." /></TableCell>
              </TableRow>
            )}
            {!isLoading && !error && workouts.length > 0 && (
              workouts.map((workout) => (
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

      {/* Pager */}
      <div className="flex justify-center py-4">
        <Button onClick={() => void fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading…' : hasNextPage ? 'Load more' : 'No more results'}
        </Button>
      </div>
    </div>
  );
} 