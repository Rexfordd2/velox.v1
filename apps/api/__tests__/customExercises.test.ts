import { appRouter } from '../src/root';

// Minimal harness to call router procedures with mocked context
const mockCtx = (supabase: any, userId: string) => ({ supabase, user: { id: userId } });

describe('customExercises API', () => {
  it('validates input and inserts records', async () => {
    const calls: any[] = [];
    const supabase = {
      from: (table: string) => {
        const api: any = {
          insert: (payload: any) => {
            calls.push({ table, op: 'insert', payload });
            return api;
          },
          select: (_: string) => api,
          single: () => ({ data: { id: '00000000-0000-0000-0000-000000000000' }, error: null }),
          eq: () => api,
          order: () => api,
        };
        return api;
      },
    } as any;

    const input = {
      name: 'My Move',
      category: 'other',
      version: 1,
      phases: [
        { name: 'phase1', transitionOn: 'time', criteria: [{ angle: { joint: 'knee', min: 30, max: 120 } }] },
      ],
      scoring: { passThreshold: 0.7, severityBands: [0.2, 0.5, 0.8] },
    } as const;

    const caller = appRouter.createCaller(mockCtx(supabase, 'u1') as any);
    const res = await caller.customExercises.create(input as any);

    expect(res).toHaveProperty('id');
    expect(calls.find((c) => c.table === 'custom_exercises')).toBeTruthy();
    expect(calls.find((c) => c.table === 'custom_exercise_criteria')).toBeTruthy();
  });
});


