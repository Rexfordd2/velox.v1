import { calcVelocity } from '../src/utils/velocity';

const fps = 60;
const frames = 240;                      // 4 s
const amplitude = 0.5;                   // meters
// y(t) = A * sin(2πt / T)  => peak velocity = 2πA / T
const ySeries = Array.from({ length: frames }, (_, i) =>
  amplitude * Math.sin((2 * Math.PI * i) / frames)
);

describe('Velocity calculation', () => {
  test('calcVelocity detects correct peaks', () => {
    const metrics = calcVelocity(ySeries, fps);
    expect(metrics).toHaveLength(2);
    expect(metrics[0].peak).toBeGreaterThan(0.6);   // ≈ 0.78 m/s
    expect(metrics[0].mean).toBeGreaterThan(0.3);
    expect(metrics[0].displacement).toBeCloseTo(amplitude, 1); // Half cycle displacement
  });

  test('calcVelocity handles constant velocity', () => {
    // Create a position series that represents constant velocity
    const positions = Array(60).fill(0).map((_, i) => i * 0.5 / fps); // 0.5 m/s
    const metrics = calcVelocity(positions, fps);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].peak).toBeCloseTo(0.5, 1);
    expect(metrics[0].mean).toBeCloseTo(0.5, 1);
  });

  test('calcVelocity handles zero velocity', () => {
    const zeroVelocity = Array(60).fill(0);
    const metrics = calcVelocity(zeroVelocity, fps);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].peak).toBeCloseTo(0, 2);
    expect(metrics[0].mean).toBeCloseTo(0, 2);
  });

  test('calcVelocity handles multiple reps', () => {
    // Create a position series that represents two reps
    const rep1 = Array.from({ length: frames / 2 }, (_, i) =>
      amplitude * Math.sin((4 * Math.PI * i) / frames)
    );
    const rep2 = Array.from({ length: frames / 2 }, (_, i) =>
      amplitude * Math.sin((4 * Math.PI * i) / frames)
    );
    const multipleReps = [...rep1, ...rep2];
    
    const metrics = calcVelocity(multipleReps, fps);
    expect(metrics).toHaveLength(3);
    expect(metrics[0].peak).toBeCloseTo(metrics[1].peak, 1);
  });
}); 