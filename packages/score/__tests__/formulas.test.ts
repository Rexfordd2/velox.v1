import {
  powerToWeight,
  technicalPower,
  explosiveness,
  velocityEndurance,
  flowPerformance,
  chooseMovementScore
} from '../src/formulas';
import { assignBuckets } from '../src/buckets';

describe('formulas', () => {
  test('powerToWeight computes W/kg', () => {
    expect(powerToWeight(3000, 75)).toBe(40);
  });

  test('technicalPower scales with technical quality (percent or fraction)', () => {
    // 3000W / 75kg = 40 W/kg; avg(0.9, 0.8) = 0.85 => 34
    expect(technicalPower(3000, 90, 80, 75)).toBeCloseTo(34, 5);
    // Same but passing fractions
    expect(technicalPower(3000, 0.9, 0.8, 75)).toBeCloseTo(34, 5);
  });

  test('explosiveness combines takeoff velocity and power-to-weight', () => {
    // takeoff 1.5 m/s * (3000/75)=40 => 60
    expect(explosiveness(1.5, 3000, 75)).toBeCloseTo(60, 5);
  });

  test('velocityEndurance uses avg power and velocity retention', () => {
    // 60kJ over 120s => 500W; 20% loss => 80% retention; 500*0.8=400
    expect(velocityEndurance(60000, 120, 20)).toBeCloseTo(400, 5);
  });

  test('flowPerformance averages beat/form/ROM on 0-100 scale', () => {
    // (95 + 90 + 85)/3 = 90
    expect(flowPerformance(95, 90, 85)).toBeCloseTo(90, 5);
  });

  test('chooseMovementScore routes to the appropriate formula', () => {
    expect(
      chooseMovementScore('power_to_weight', { peakPowerW: 3000, bodyKg: 75 })
    ).toBe(40);

    expect(
      chooseMovementScore('technical', {
        peakPowerW: 3000,
        formQuality: 90,
        barPathConsistency: 80,
        bodyKg: 75
      })
    ).toBeCloseTo(34, 5);

    expect(
      chooseMovementScore('explosiveness', {
        takeoffVel: 1.5,
        peakPowerW: 3000,
        bodyKg: 75
      })
    ).toBeCloseTo(60, 5);

    expect(
      chooseMovementScore('velocity_endurance', {
        totalWorkJ: 60000,
        timeS: 120,
        velLossPct: 20
      })
    ).toBeCloseTo(400, 5);

    expect(
      chooseMovementScore('flow', { beatPct: 95, formPct: 90, romConsistencyPct: 85 })
    ).toBeCloseTo(90, 5);
  });
});

describe('buckets', () => {
  test('assignBuckets maps profile to canonical buckets', () => {
    const profile = { age: 29, bodyWeightKg: 78, experienceYears: 2.5 };
    const buckets = assignBuckets(profile);
    expect(buckets.age).toBe('25-34');
    expect(buckets.bodyWeightKg).toBe('70-79.9');
    expect(buckets.experience).toBe('intermediate');
  });

  test('assignBuckets respects explicit experience label', () => {
    const profile = { age: 40, bodyWeightKg: 90, experience: 'Advanced' } as any;
    const buckets = assignBuckets(profile);
    expect(buckets.experience).toBe('advanced');
  });
});
