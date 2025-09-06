import { analyzeVelocity } from '../../utils/velocity';

function genSinePath({ seconds, fps, amplitude }: { seconds: number; fps: number; amplitude: number }) {
  const total = Math.floor(seconds * fps);
  const dt = 1 / fps;
  const raw: { t: number; x: number; y: number; score?: number }[] = [];
  for (let i = 0; i < total; i++) {
    const t = i * dt;
    const y = amplitude * Math.sin((2 * Math.PI * t) / seconds);
    raw.push({ t, x: 0, y, score: 0.95 });
  }
  return raw;
}

describe('velocity validation & confidence', () => {
  test('Noisy path → outliers removed, confidence ~0.8+', () => {
    const fps = 60;
    const raw = genSinePath({ seconds: 4, fps, amplitude: 0.5 });
    // Inject noise spikes
    for (let i = 20; i < raw.length; i += 37) {
      raw[i].y += (i % 2 === 0 ? 1 : -1) * 0.2; // 20 cm spikes
    }
    const stats = analyzeVelocity(raw, { dt: 1 / fps });
    // Expect some outliers detected
    expect(stats.outliers.length).toBeGreaterThanOrEqual(5);
    // Confidence should remain reasonably high
    expect(stats.confidence).toBeGreaterThan(0.8);
    // Velocity std should be finite
    expect(Number.isFinite(stats.std)).toBe(true);
  });

  test('Many gaps → confidence <0.6', () => {
    const fps = 60;
    const raw = genSinePath({ seconds: 4, fps, amplitude: 0.5 });
    // Remove chunks to create gaps
    const gappy: typeof raw = [];
    for (let i = 0; i < raw.length; i++) {
      if ((i % 30) < 20) gappy.push(raw[i]); // 10/30 frames missing repeatedly
    }
    const stats = analyzeVelocity(gappy, { dt: 1 / fps });
    expect(stats.confidence).toBeLessThan(0.6);
  });

  test('Jump artifact flagged', () => {
    const fps = 60;
    const raw = genSinePath({ seconds: 3, fps, amplitude: 0.4 });
    // Insert sudden jump in position
    const idx = Math.floor(raw.length / 2);
    raw[idx].y += 1.2; // big jump
    const stats = analyzeVelocity(raw, { dt: 1 / fps });
    const hasJump = stats.outliers.some(o => o.reason === 'Jump');
    expect(hasJump).toBe(true);
  });
});



