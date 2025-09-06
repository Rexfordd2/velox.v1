import type { ExerciseDefinition, PoseCriterion } from '../exercises.schema';

export function validateExercise(def: ExerciseDefinition): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!def) {
    return { ok: false, errors: ['Definition is required'] };
  }

  if (!def.name || def.name.trim().length < 2) {
    errors.push('name: must be at least 2 characters');
  }

  const allowedCategories = ['lower', 'upper', 'core', 'olympic', 'other'];
  if (!allowedCategories.includes(def.category)) {
    errors.push(`category: must be one of ${allowedCategories.join(', ')}`);
  }

  if (!Number.isInteger(def.version) || def.version < 1) {
    errors.push('version: must be integer >= 1');
  }

  if (!def.scoring) {
    errors.push('scoring: required');
  } else {
    const { passThreshold, severityBands } = def.scoring;
    if (typeof passThreshold !== 'number' || passThreshold < 0 || passThreshold > 1) {
      errors.push('scoring.passThreshold: must be number in [0,1]');
    }
    if (!Array.isArray(severityBands) || severityBands.length === 0 || !severityBands.every((n) => typeof n === 'number')) {
      errors.push('scoring.severityBands: must be non-empty number[]');
    }
  }

  if (!Array.isArray(def.phases) || def.phases.length === 0) {
    errors.push('phases: must be a non-empty array');
  } else {
    def.phases.forEach((phase, idx) => {
      if (!phase.name || phase.name.trim().length === 0) {
        errors.push(`phases[${idx}].name: required`);
      }

      const allowedTransitions = ['angle', 'velocity', 'time', 'landmark'];
      if (!allowedTransitions.includes(phase.transitionOn)) {
        errors.push(`phases[${idx}].transitionOn: must be one of ${allowedTransitions.join(', ')}`);
      }

      if (!Array.isArray(phase.criteria) || phase.criteria.length === 0) {
        errors.push(`phases[${idx}].criteria: must be a non-empty array`);
      } else {
        phase.criteria.forEach((criterion: PoseCriterion, cIdx) => {
          const hasAny = Boolean(
            criterion.jointPairs?.length ||
              criterion.angle ||
              criterion.rom ||
              criterion.velocity ||
              criterion.holdMs
          );
          if (!hasAny) {
            errors.push(`phases[${idx}].criteria[${cIdx}]: must specify at least one rule`);
          }

          if (criterion.angle) {
            const { joint, min, max } = criterion.angle;
            if (!joint) errors.push(`phases[${idx}].criteria[${cIdx}].angle.joint: required`);
            if (min !== undefined && max !== undefined && min > max) {
              errors.push(`phases[${idx}].criteria[${cIdx}].angle: min cannot exceed max`);
            }
          }

          if (criterion.rom) {
            const { joint, min, max } = criterion.rom;
            if (!joint) errors.push(`phases[${idx}].criteria[${cIdx}].rom.joint: required`);
            if (min !== undefined && max !== undefined && min > max) {
              errors.push(`phases[${idx}].criteria[${cIdx}].rom: min cannot exceed max`);
            }
          }

          if (criterion.velocity) {
            const { joint, min, max } = criterion.velocity;
            if (!joint) errors.push(`phases[${idx}].criteria[${cIdx}].velocity.joint: required`);
            if (min !== undefined && max !== undefined && min > max) {
              errors.push(`phases[${idx}].criteria[${cIdx}].velocity: min cannot exceed max`);
            }
          }

          if (criterion.holdMs !== undefined && (criterion.holdMs as number) < 0) {
            errors.push(`phases[${idx}].criteria[${cIdx}].holdMs: must be >= 0`);
          }

          if (criterion.weight !== undefined && (criterion.weight as number) < 0) {
            errors.push(`phases[${idx}].criteria[${cIdx}].weight: must be >= 0`);
          }
        });
      }
    });
  }

  return { ok: errors.length === 0, errors };
}


