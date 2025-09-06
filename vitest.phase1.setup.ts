import { vi, describe, it, test, expect, beforeEach, afterEach } from "vitest";

// minimal env so createClient won't complain
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";

// Make Vitest globals available
Object.assign(global, {
  describe,
  it,
  test,
  expect,
  beforeEach,
  afterEach,
});

// global mock for every import of @supabase/supabase-js
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://mock.cdn/avatar.jpg" },
        }),
      }),
    },
  }),
})); 