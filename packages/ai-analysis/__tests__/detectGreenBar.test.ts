import { expect, test } from "vitest";
import { detectGreenBar } from "@/lib/vision/detectGreenBar";
import path from "path";

test("detects sample bar ~300 px", async () => {
  const uri = path.resolve(__dirname, "../__fixtures__/green_bar.jpg");
  const width = await detectGreenBar(uri);
  expect(width).not.toBeNull();
  expect(width!).toBeGreaterThan(250);
  expect(width!).toBeLessThan(350);
}); 