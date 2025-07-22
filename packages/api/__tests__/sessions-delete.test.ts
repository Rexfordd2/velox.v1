import { expect, test } from "vitest";
import { createCaller } from "../src/trpc-test-helpers";

test("user can delete own session but not others", async () => {
  const caller = await createCaller({ userId: "user-a" });

  // insert dummy session owned by user-a
  const { data: session } = await caller.supabase
    .from("sessions")
    .insert({ user_id: "user-a" })
    .select()
    .single();

  await expect(
    caller.sessions.delete({ id: session.id })
  ).resolves.toEqual({ success: true });

  // user-b should fail
  const callerB = await createCaller({ userId: "user-b" });
  await expect(
    callerB.sessions.delete({ id: session.id })
  ).rejects.toThrow();
}); 