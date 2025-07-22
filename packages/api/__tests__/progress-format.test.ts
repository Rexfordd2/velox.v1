import { createCaller } from "../src/trpc-test-helpers";

test("progress.get returns labels & values arrays", async () => {
  const caller = await createCaller({ userId: "user-a" });
  const res = await caller.progress.get({ movement: "squat", weeks: 4 });
  expect(res.labels.length).toBe(res.values.length);
}); 