import { describe, it, expect, vi } from "vitest";
import { uploadAvatar } from "../uploadAvatar";
import { supabase } from "../supabase-client";

vi.mock("../supabase-client", () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: "https://example.com/avatar.jpg" },
      }),
    },
  },
}));

describe("uploadAvatar", () => {
  it("returns public URL", async () => {
    const url = await uploadAvatar(new Blob(["x"]), "user123");
    expect(url).toBe("https://example.com/avatar.jpg");
  });
}); 