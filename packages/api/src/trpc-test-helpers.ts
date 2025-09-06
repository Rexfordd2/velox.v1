import { createTRPCRouter, type Context } from "./trpc";
import { appRouter } from "./router";

function createSupabaseStub() {
  const tables: Record<string, any[]> = {
    sessions: [],
  };
  const makeChain = (table: string) => {
    let rows = tables[table] ?? (tables[table] = []);
    let op: 'select' | 'insert' | 'update' | 'delete' | null = null;
    let pendingInsert: any = null;
    const filters: Array<{ col: string; val: any }> = [];
    const chain: any = {};
    chain._rows = rows;

    const applyFilters = (inputRows: any[]) =>
      inputRows.filter(row => filters.every(f => row[f.col] === f.val));

    const applyAndCompute = () => {
      // Handle pending insert
      if (op === 'insert' && pendingInsert) {
        const item = pendingInsert;
        rows.push(item);
        pendingInsert = null;
        return { data: [item], error: null };
      }
      // Handle delete with current filters
      if (op === 'delete') {
        const keep = rows.filter(r => !filters.every(f => r[f.col] === f.val));
        const removed = rows.length - keep.length;
        tables[table] = keep;
        rows = keep;
        chain._rows = rows;
        const error = removed === 0 ? { message: 'delete failed: not authorized or not found' } : null;
        return { data: { count: removed }, error };
      }
      // Default select
      const data = applyFilters(rows);
      return { data, error: null };
    };

    chain.select = () => { op = 'select'; return chain; };
    chain.eq = (col: string, val: any) => { filters.push({ col, val }); return chain; };
    chain.order = () => chain;
    chain.limit = () => chain;
    chain.single = async () => {
      // Apply any pending insert regardless of current op so
      // chains like insert().select().single() return the new row
      if (pendingInsert) {
        const item = pendingInsert;
        rows.push(item);
        pendingInsert = null;
      }
      const result = applyAndCompute();
      const first = Array.isArray(result.data) ? result.data[0] ?? null : result.data ?? null;
      return { data: first, error: null };
    };
    chain.maybeSingle = chain.single;
    // Proper thenable so `await chain` resolves in router code
    chain.then = (onFulfilled?: (v: any) => any, _onRejected?: (e: any) => any) => {
      // Flush pending insert before computing result
      if (pendingInsert) {
        const item = pendingInsert;
        rows.push(item);
        pendingInsert = null;
      }
      const result = applyAndCompute();
      return Promise.resolve(onFulfilled ? onFulfilled(result) : result);
    };
    chain.insert = (obj: any) => {
      op = 'insert';
      const newId = '00000000-0000-0000-0000-000000000000';
      pendingInsert = { id: newId, ...obj };
      return chain;
    };
    chain.delete = () => { op = 'delete'; return chain; };
    chain.update = () => chain;
    chain.upsert = () => chain;
    chain.throwOnError = () => chain;
    return chain;
  };
  return {
    from: (table: string) => makeChain(table),
    storage: { from: () => ({ upload: async () => ({ data: {}, error: null }) }) },
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
  } as any;
}

export async function createCaller({ userId }: { userId: string }) {
  const supabase = createSupabaseStub();

  const ctx: Context = {
    user: { id: userId },
    supabase,
  };

  const trpcCaller: any = appRouter.createCaller(ctx);
  // Return a plain object to avoid TRPC Proxy intercepting `supabase`
  return {
    sessions: trpcCaller.sessions,
    progress: trpcCaller.progress,
    supabase,
  } as { sessions: any; progress: any; supabase: any };
} 