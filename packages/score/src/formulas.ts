function clampToUnitInterval(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function normalizePercentInput(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const fraction = value > 1 ? value / 100 : value;
  return clampToUnitInterval(fraction);
}

export function powerToWeight(peakPowerW: number, bodyKg: number): number {
  if (!Number.isFinite(peakPowerW) || !Number.isFinite(bodyKg) || bodyKg <= 0) return 0;
  return peakPowerW / bodyKg;
}

export function technicalPower(
  peakPowerW: number,
  formQuality: number,
  barPathConsistency: number,
  bodyKg: number
): number {
  const ptw = powerToWeight(peakPowerW, bodyKg);
  const form = normalizePercentInput(formQuality);
  const barPath = normalizePercentInput(barPathConsistency);
  const technicalMultiplier = (form + barPath) / 2;
  return ptw * technicalMultiplier;
}

export function explosiveness(
  takeoffVel: number,
  peakPowerW: number,
  bodyKg: number
): number {
  if (!Number.isFinite(takeoffVel) || takeoffVel < 0) return 0;
  const ptw = powerToWeight(peakPowerW, bodyKg);
  return takeoffVel * ptw;
}

export function velocityEndurance(
  totalWorkJ: number,
  timeS: number,
  velLossPct: number
): number {
  if (!Number.isFinite(totalWorkJ) || !Number.isFinite(timeS) || timeS <= 0) return 0;
  const avgPower = totalWorkJ / timeS; // Watts
  const retention = 1 - normalizePercentInput(velLossPct);
  return avgPower * retention;
}

export function flowPerformance(
  beatPct: number,
  formPct: number,
  romConsistencyPct: number
): number {
  const beat = normalizePercentInput(beatPct);
  const form = normalizePercentInput(formPct);
  const rom = normalizePercentInput(romConsistencyPct);
  const avg = (beat + form + rom) / 3;
  return avg * 100; // Return on a 0-100 scale
}

export function chooseMovementScore(movementCategory: string, inputs: any): number {
  const key = String(movementCategory || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  switch (key) {
    case 'power_to_weight':
    case 'powertoweight':
      return powerToWeight(inputs?.peakPowerW, inputs?.bodyKg);

    case 'technical':
    case 'technical_power':
    case 'technicalpower':
      return technicalPower(
        inputs?.peakPowerW,
        inputs?.formQuality,
        inputs?.barPathConsistency,
        inputs?.bodyKg
      );

    case 'explosiveness':
      return explosiveness(inputs?.takeoffVel, inputs?.peakPowerW, inputs?.bodyKg);

    case 'velocity_endurance':
    case 'velocityendurance':
      return velocityEndurance(inputs?.totalWorkJ, inputs?.timeS, inputs?.velLossPct);

    case 'flow':
    case 'flow_performance':
    case 'flowperformance':
      return flowPerformance(inputs?.beatPct, inputs?.formPct, inputs?.romConsistencyPct);

    default:
      throw new Error(`Unknown movement category: ${movementCategory}`);
  }
}
