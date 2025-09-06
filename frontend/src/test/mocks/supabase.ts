import { vi } from 'vitest';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
  }
}));

interface Exercise {
  id: number;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  muscle_groups: string[];
  equipment: string[];
  instructions: string;
}

interface Session {
  id: number;
  user_id: string;
  exercise_id: number;
  created_at: string;
  score: number;
  reps: number;
  difficulty: string;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  created_at: string;
}

interface MockDataMap {
  exercises: Exercise[];
  sessions: Session[];
  profiles: Profile[];
  [key: string]: any[];
}

const mockErrors: Record<string, any | null> = Object.create(null);
let currentUserId = 'test-user';
let strictRLS = false;
let requestCount: Record<string, number> = Object.create(null);

// Create a mock query builder that maintains chain state
class QueryBuilder {
  private query: any = {};
  private table: string;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    this.query.select = columns || '*';
    return this;
  }

  eq(column: string, value: any) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'eq', column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.query.order = { column, ...options };
    return this;
  }

  single() {
    const tableError = mockErrors[this.table];
    if (tableError) return Promise.resolve({ data: null, error: tableError });

    const tableRows = mockData[this.table] || [];
    let result: any = tableRows[0] ?? null;

    if (this.query.filters && result) {
      const matches = this.query.filters.every((filter: any) => {
        if (filter.type === 'eq') return result[filter.column] === filter.value;
        return true;
      });
      if (!matches) result = null;
    }
    return Promise.resolve({ data: result, error: null });
  }

  insert(data: any) {
    this.query.type = 'insert';
    this.query.data = data;
    return this;
  }

  update(data: any) {
    this.query.type = 'update';
    this.query.data = data;
    return this;
  }

  delete() {
    this.query.type = 'delete';
    return this;
  }

  match(query: any) {
    this.query.match = query;
    return this;
  }

  in(column: string, values: any[]) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'in', column, values });
    return this;
  }

  gt(column: string, value: any) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'gt', column, value });
    return this;
  }

  lt(column: string, value: any) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'lt', column, value });
    return this;
  }

  gte(column: string, value: any) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'gte', column, value });
    return this;
  }

  lte(column: string, value: any) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'lte', column, value });
    return this;
  }

  neq(column: string, value: any) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'neq', column, value });
    return this;
  }

  like(column: string, pattern: string) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'like', column, pattern });
    return this;
  }

  ilike(column: string, pattern: string) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'ilike', column, pattern });
    return this;
  }

  is(column: string, value: any) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'is', column, value });
    return this;
  }

  contains(column: string, value: any) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'contains', column, value });
    return this;
  }

  containedBy(column: string, value: any) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'containedBy', column, value });
    return this;
  }

  range(column: string, from: any, to: any) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'range', column, from, to });
    return this;
  }

  textSearch(column: string, query: string) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'textSearch', column, query });
    return this;
  }

  filter(column: string, operator: string, value: any) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'filter', column, operator, value });
    return this;
  }

  not(column: string, operator: string, value: any) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'not', column, operator, value });
    return this;
  }

  or(filters: any[]) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'or', filters });
    return this;
  }

  and(filters: any[]) {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push({ type: 'and', filters });
    return this;
  }

  then(resolve?: (v: any) => void, reject?: (e: any) => void) {
    try {
      const tableError = mockErrors[this.table];
      // Simulate simple RLS: any filter on user_id not equal to current user yields error
      const userFilter = (this.query.filters || []).find((f: any) => f.type === 'eq' && f.column === 'user_id');
      if (userFilter && userFilter.value !== currentUserId) {
        if (strictRLS) {
          resolve && resolve({ data: null, error: new Error('Forbidden') });
          return;
        } else {
          resolve && resolve({ data: [], error: null });
          return;
        }
      }
      // Profiles privacy: block direct id lookup for other users
      const idFilter = (this.query.filters || []).find((f: any) => f.type === 'eq' && f.column === 'id');
      if (this.table === 'profiles' && idFilter && idFilter.value !== currentUserId) {
        if (strictRLS) {
          resolve && resolve({ data: null, error: new Error('Forbidden') });
          return;
        } else {
          resolve && resolve({ data: [], error: null });
          return;
        }
      }
      // Require auth for broad reads without filters on sessions
      if (this.table === 'sessions' && (!this.query.filters || this.query.filters.length === 0)) {
        resolve && resolve({ data: null, error: new Error('Auth required') });
        return;
      }
      if (tableError) {
        resolve && resolve({ data: null, error: tableError });
        return;
      }

      const rows = [...(mockData[this.table] || [])];
      let result: any = rows;

      // Apply filters
      if (this.query.filters) {
        result = result.filter((item: any) => {
          return this.query.filters.every((filter: any) => {
            if (filter.type === 'eq') return item[filter.column] === filter.value;
            return true;
          });
        });
      }

      // Basic rate limiting for select-heavy tests
      if (this.query.select) {
        const key = `${this.table}:select`;
        requestCount[key] = (requestCount[key] || 0) + 1;
        if (requestCount[key] > 100) {
          resolve && resolve({ data: null, error: new Error('Too many requests') });
          return;
        }
      }

      // Apply mutations
      if (this.query.type === 'insert') {
        const newItem = { id: Date.now(), ...this.query.data };
        mockData[this.table] = [...rows, newItem];
        result = [newItem];
      } else if (this.query.type === 'update') {
        const updated = rows.map((item: any) => {
          const matches = (this.query.filters || []).every((f: any) => f.type !== 'eq' || item[f.column] === f.value);
          return matches ? { ...item, ...this.query.data } : item;
        });
        mockData[this.table] = updated;
        result = null;
      } else if (this.query.type === 'delete') {
        const remaining = rows.filter((item: any) => !(this.query.filters || []).every((f: any) => f.type !== 'eq' || item[f.column] === f.value));
        mockData[this.table] = remaining;
        result = null;
      }

      // Apply ordering
      if (this.query.order && Array.isArray(result)) {
        const { column, ascending = true } = this.query.order;
        result = [...result].sort((a: any, b: any) => {
          const av = a[column];
          const bv = b[column];
          if (av === bv) return 0;
          return ascending ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });
      }

      resolve && resolve({ data: result, error: null });
    } catch (e) {
      reject && reject(e);
    }
  }
}

// Mock data for tests
const mockData: MockDataMap = {
  exercises: [
    {
      id: 1,
      name: 'Push-up',
      description: 'A basic bodyweight exercise',
      category: 'strength',
      difficulty: 'beginner',
      muscle_groups: ['chest', 'shoulders'],
      equipment: ['none'],
      instructions: 'Start in a plank position...'
    }
  ],
  sessions: [
    {
      id: 1,
      user_id: 'test-user-id',
      exercise_id: 1,
      created_at: new Date().toISOString(),
      score: 85,
      reps: 10,
      difficulty: 'beginner'
    }
  ],
  profiles: [
    {
      id: 'test-user-id',
      username: 'testuser',
      avatar_url: 'https://test.cdn/avatar.jpg',
      created_at: new Date().toISOString()
    }
  ]
};

// Mock Supabase client
export const mockSupabaseClient = {
  from: (table: string) => {
    const builder = new QueryBuilder(table);
    return {
      select: (columns?: string) => {
        builder.select(columns);
        return builder;
      },
      eq: (column: string, value: any) => {
        builder.eq(column, value);
        return builder;
      },
      order: (column: string, options?: { ascending?: boolean }) => {
        builder.order(column, options);
        return builder;
      },
      single: () => builder.single(),
      update: (data: any) => {
        builder.update(data);
        return builder;
      },
      delete: () => {
        builder.delete();
        return builder;
      },
      then: () => builder.then()
    };
  },
  storage: {
    from: () => ({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.cdn/test.mp4' } }),
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://test.cdn/signed.mp4' } }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null })
    })
  },
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        }
      },
      error: null
    })
  }
};

// Mock Supabase module
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient
})); 

// Helpers for tests to control mock data and errors
export function setMockTableData(table: string, rows: any[]) {
  mockData[table] = Array.isArray(rows) ? rows : [];
}

export function setMockTableError(table: string, error: any | null) {
  mockErrors[table] = error;
}

export function resetSupabaseMock() {
  for (const key of Object.keys(mockData)) {
    if (Array.isArray(mockData[key])) mockData[key] = [];
  }
  for (const k of Object.keys(mockErrors)) delete mockErrors[k];
  requestCount = Object.create(null);
  // Seed defaults again if needed
  mockData.exercises = [
    {
      id: 1,
      name: 'Push-up',
      description: 'A basic bodyweight exercise',
      category: 'strength',
      difficulty: 'beginner',
      muscle_groups: ['chest', 'shoulders'],
      equipment: ['none'],
      instructions: 'Start in a plank position...'
    }
  ];
  mockData.sessions = [
    {
      id: 1,
      user_id: 'test-user-id',
      exercise_id: 1,
      created_at: new Date().toISOString(),
      score: 85,
      reps: 10,
      difficulty: 'beginner'
    }
  ];
  mockData.profiles = [
    {
      id: 'test-user-id',
      username: 'testuser',
      avatar_url: 'https://test.cdn/avatar.jpg',
      created_at: new Date().toISOString()
    }
  ];
}

export function setMockCurrentUserId(userId: string) {
  currentUserId = userId;
}

export function setStrictRLS(val: boolean) {
  strictRLS = val;
}