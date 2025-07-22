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

interface MockData {
  exercises: Exercise[];
  sessions: Session[];
  profiles: Profile[];
  [key: string]: any;
}

// Create a mock query builder that maintains chain state
class QueryBuilder {
  private query: any = {};
  private mockData: any = null;
  private mockError: any = null;

  constructor(mockData: any = null, mockError: any = null) {
    this.mockData = mockData;
    this.mockError = mockError;
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
    if (this.mockError) {
      return Promise.resolve({ data: null, error: this.mockError });
    }

    if (!this.mockData) {
      return Promise.resolve({ data: null, error: null });
    }

    let result = Array.isArray(this.mockData) ? this.mockData[0] : this.mockData;

    if (this.query.filters) {
      const matches = this.query.filters.every((filter: any) => {
        if (filter.type === 'eq') {
          return result[filter.column] === filter.value;
        }
        return true;
      });
      if (!matches) {
        result = null;
      }
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

  then() {
    if (this.mockError) {
      return Promise.resolve({ data: null, error: this.mockError });
    }

    let result = this.mockData;

    if (this.query.filters) {
      result = Array.isArray(result) ? result.filter((item: any) => {
        return this.query.filters.every((filter: any) => {
          if (filter.type === 'eq') {
            return item[filter.column] === filter.value;
          }
          return true;
        });
      }) : result;
    }

    if (this.query.type === 'insert') {
      const newItem = { id: Date.now(), ...this.query.data };
      result = [newItem];
    }

    return Promise.resolve({ data: result, error: null });
  }
}

// Mock data for tests
const mockData: MockData = {
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
    const builder = new QueryBuilder(mockData[table] || []);
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