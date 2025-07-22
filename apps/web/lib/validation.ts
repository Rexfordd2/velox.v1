import { z } from 'zod';

// Common validation patterns
const patterns = {
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  phoneNumber: /^\+?[1-9]\d{1,14}$/,
} as const;

// Common error messages
const errorMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  password: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character',
  username: 'Username must be 3-20 characters and can contain letters, numbers, underscores and hyphens',
  phone: 'Please enter a valid phone number',
  url: 'Please enter a valid URL',
  numeric: 'Please enter a valid number',
  date: 'Please enter a valid date',
  min: (min: number) => `Must be at least ${min} characters`,
  max: (max: number) => `Must be at most ${max} characters`,
} as const;

// Base schemas for common fields
export const baseSchemas = {
  email: z.string().email(errorMessages.email),
  password: z.string().regex(patterns.password, errorMessages.password),
  username: z.string().regex(patterns.username, errorMessages.username),
  phoneNumber: z.string().regex(patterns.phoneNumber, errorMessages.phone),
  url: z.string().url(errorMessages.url),
  date: z.coerce.date(),
  numeric: z.number(),
} as const;

// User input schemas
export const userSchemas = {
  registration: z.object({
    email: baseSchemas.email,
    password: baseSchemas.password,
    username: baseSchemas.username,
    fullName: z.string().min(2, errorMessages.min(2)).max(50, errorMessages.max(50)),
    phoneNumber: baseSchemas.phoneNumber.optional(),
    acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  }),

  login: z.object({
    email: baseSchemas.email,
    password: z.string().min(1, errorMessages.required),
    rememberMe: z.boolean().optional(),
  }),

  resetPassword: z.object({
    email: baseSchemas.email,
  }),

  updatePassword: z.object({
    currentPassword: z.string().min(1, errorMessages.required),
    newPassword: baseSchemas.password,
    confirmPassword: baseSchemas.password,
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),

  updateProfile: z.object({
    username: baseSchemas.username.optional(),
    fullName: z.string().min(2).max(50).optional(),
    bio: z.string().max(500).optional(),
    phoneNumber: baseSchemas.phoneNumber.optional(),
    avatarUrl: baseSchemas.url.optional(),
  }),
} as const;

// Exercise-specific validation patterns
const exercisePatterns = {
  // Validate exercise form based on type
  formValidation: {
    squat: {
      minDepth: 0.6, // 60% of max depth
      kneeAlignment: 15, // degrees of acceptable deviation
      backAngle: 30, // max forward lean in degrees
      minConfidence: 0.7,
    },
    deadlift: {
      backAngle: 20, // degrees from vertical
      barPath: 10, // cm deviation from vertical
      hipHinge: 45, // minimum hip hinge angle
      minConfidence: 0.8,
    },
    benchPress: {
      barPath: 8, // cm deviation from ideal
      elbowAngle: 45, // minimum angle at bottom
      wristAlignment: 15, // degrees of acceptable deviation
      minConfidence: 0.75,
    },
  },

  // Validate rep tempo
  repTempo: {
    minEccentricDuration: 1000, // milliseconds
    minConcentricduration: 800, // milliseconds
    maxPauseDuration: 2000, // milliseconds
    minPauseDuration: 200, // milliseconds
  },

  // Validate set parameters
  setParameters: {
    minReps: 1,
    maxReps: 100,
    minSets: 1,
    maxSets: 20,
    minRestPeriod: 30, // seconds
    maxRestPeriod: 600, // seconds
  },

  // Advanced exercise validation patterns
  advancedFormValidation: {
    squat: {
      kneeTrack: {
        maxLateralDeviation: 5, // cm
        maxForwardTravel: 10, // cm past toes
      },
      hipAlignment: {
        maxAsymmetry: 5, // degrees
        maxTilt: 10, // degrees
      },
      footPosition: {
        minWidth: 'shoulder-width',
        maxWidth: 'shoulder-width * 1.5',
        maxRotation: 30, // degrees
      },
      barPath: {
        maxHorizontalDeviation: 5, // cm
        idealVerticalPath: true,
      },
    },
    deadlift: {
      startPosition: {
        barOverMidfoot: true,
        shoulderOverBar: true,
        hipHeight: 'above-knee',
      },
      barPath: {
        maxHorizontalDeviation: 3, // cm
        contactThigh: false,
      },
      spineAngle: {
        maxFlexion: 15, // degrees
        maxExtension: 5, // degrees
      },
      gripWidth: {
        min: 'shoulder-width',
        max: 'shoulder-width * 1.2',
      },
    },
    benchPress: {
      gripWidth: {
        min: 'shoulder-width * 1.2',
        max: 'shoulder-width * 2',
      },
      elbowPath: {
        maxFlare: 75, // degrees
        minTuck: 30, // degrees
      },
      shoulderPosition: {
        retracted: true,
        maxElevation: 15, // degrees
      },
      touchPoint: {
        min: 'nipple-line',
        max: 'bottom-sternum',
      },
    },
  },

  // Movement velocity thresholds
  velocityThresholds: {
    squat: {
      eccentric: {
        optimal: 0.5, // m/s
        range: [0.3, 0.7], // m/s
      },
      concentric: {
        optimal: 0.8, // m/s
        range: [0.6, 1.0], // m/s
      },
    },
    deadlift: {
      eccentric: {
        optimal: 0.6, // m/s
        range: [0.4, 0.8], // m/s
      },
      concentric: {
        optimal: 0.9, // m/s
        range: [0.7, 1.1], // m/s
      },
    },
    benchPress: {
      eccentric: {
        optimal: 0.4, // m/s
        range: [0.2, 0.6], // m/s
      },
      concentric: {
        optimal: 0.7, // m/s
        range: [0.5, 0.9], // m/s
      },
    },
  },

  // Range of motion requirements
  rangeOfMotion: {
    squat: {
      hipDepth: {
        min: 'below-parallel',
        ideal: 'parallel',
        max: 'above-parallel',
      },
      kneeFlexion: {
        min: 120, // degrees
        ideal: 125,
        max: 140,
      },
    },
    deadlift: {
      hipExtension: {
        min: 170, // degrees
        ideal: 180,
        max: 185,
      },
      kneeExtension: {
        min: 165,
        ideal: 175,
        max: 180,
      },
    },
    benchPress: {
      barToChest: {
        min: 0, // cm (touch chest)
        max: 2, // cm above chest
      },
      elbowFlexion: {
        min: 85, // degrees
        ideal: 90,
        max: 100,
      },
    },
  },

  // Exercise progression thresholds
  progressionThresholds: {
    beginner: {
      minFormScore: 70,
      maxWeightIncrease: 0.05, // 5% per session
      minRepsBeforeWeight: 5,
      maxFailedAttempts: 2,
    },
    intermediate: {
      minFormScore: 80,
      maxWeightIncrease: 0.025, // 2.5% per session
      minRepsBeforeWeight: 3,
      maxFailedAttempts: 1,
    },
    advanced: {
      minFormScore: 90,
      maxWeightIncrease: 0.01, // 1% per session
      minRepsBeforeWeight: 2,
      maxFailedAttempts: 1,
    },
  },
} as const;

// Update the exercise type enum
const EXERCISE_TYPES = {
  SQUAT: 'squat',
  DEADLIFT: 'deadlift',
  BENCH_PRESS: 'benchPress',
} as const;

type ExerciseType = typeof EXERCISE_TYPES[keyof typeof EXERCISE_TYPES];

// Update the schema to use the consistent type
export const exerciseSchemas = {
  workout: z.object({
    title: z.string().min(1, errorMessages.required).max(100),
    description: z.string().max(500).optional(),
    exerciseType: z.enum(['squat', 'deadlift', 'bench_press']),
    sets: z.number().int().min(1).max(20),
    reps: z.number().int().min(1).max(100),
    weight: z.number().min(0).max(1000),
    notes: z.string().max(1000).optional(),
  }),

  formAnalysis: z.object({
    exerciseType: z.enum(['squat', 'deadlift', 'bench_press']),
    videoUrl: baseSchemas.url,
    metadata: z.object({
      duration: z.number().min(1),
      frameRate: z.number().min(1),
      resolution: z.object({
        width: z.number().min(1),
        height: z.number().min(1),
      }),
    }),
    keypoints: z.array(z.object({
      name: z.string(),
      confidence: z.number().min(0).max(1),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
    })).min(1),
    angles: z.array(z.object({
      name: z.string(),
      value: z.number(),
      confidence: z.number().min(0).max(1),
    })).optional(),
  }).superRefine((data, ctx) => {
    // Get thresholds for specific exercise
    const thresholds = exercisePatterns.formValidation[
      data.exerciseType === 'bench_press' ? 'benchPress' : data.exerciseType
    ];

    // Validate keypoint confidence
    const lowConfidenceKeypoints = data.keypoints.filter(
      kp => kp.confidence < thresholds.minConfidence
    );

    if (lowConfidenceKeypoints.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Low confidence for keypoints: ${lowConfidenceKeypoints.map(kp => kp.name).join(', ')}`,
        path: ['keypoints'],
      });
    }

    // Validate angles if present
    if (data.angles) {
      switch (data.exerciseType) {
        case 'squat':
          validateSquatAngles(data.angles, ctx);
          break;
        case 'deadlift':
          validateDeadliftAngles(data.angles, ctx);
          break;
        case 'bench_press':
          validateBenchPressAngles(data.angles, ctx);
          break;
      }
    }
  }),

  repAnalysis: z.object({
    exerciseType: z.enum(['squat', 'deadlift', 'bench_press']),
    repCount: z.number().int().min(1),
    repData: z.array(z.object({
      startTime: z.number(),
      endTime: z.number(),
      phases: z.object({
        eccentric: z.object({
          duration: z.number(),
          startAngle: z.number(),
          endAngle: z.number(),
        }),
        bottomPause: z.object({
          duration: z.number(),
          angle: z.number(),
        }).optional(),
        concentric: z.object({
          duration: z.number(),
          startAngle: z.number(),
          endAngle: z.number(),
        }),
        topPause: z.object({
          duration: z.number(),
          angle: z.number(),
        }).optional(),
      }),
      formScore: z.number().min(0).max(100),
      issues: z.array(z.object({
        type: z.string(),
        severity: z.enum(['low', 'medium', 'high']),
        message: z.string(),
      })).optional(),
    })).min(1),
    summary: z.object({
      averageFormScore: z.number().min(0).max(100),
      consistencyScore: z.number().min(0).max(100),
      majorIssues: z.array(z.string()).optional(),
      recommendations: z.array(z.string()).optional(),
    }),
  }).superRefine((data, ctx) => {
    const { minEccentricDuration, minConcentricduration, maxPauseDuration, minPauseDuration } = exercisePatterns.repTempo;

    // Validate each rep's tempo
    data.repData.forEach((rep, index) => {
      const { phases } = rep;

      // Check eccentric phase duration
      if (phases.eccentric.duration < minEccentricDuration) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Rep ${index + 1}: Eccentric phase too fast (${phases.eccentric.duration}ms)`,
          path: ['repData', index, 'phases', 'eccentric'],
        });
      }

      // Check concentric phase duration
      if (phases.concentric.duration < minConcentricduration) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Rep ${index + 1}: Concentric phase too fast (${phases.concentric.duration}ms)`,
          path: ['repData', index, 'phases', 'concentric'],
        });
      }

      // Check pause durations if present
      if (phases.bottomPause && (
        phases.bottomPause.duration > maxPauseDuration ||
        phases.bottomPause.duration < minPauseDuration
      )) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Rep ${index + 1}: Bottom pause duration invalid (${phases.bottomPause.duration}ms)`,
          path: ['repData', index, 'phases', 'bottomPause'],
        });
      }

      if (phases.topPause && (
        phases.topPause.duration > maxPauseDuration ||
        phases.topPause.duration < minPauseDuration
      )) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Rep ${index + 1}: Top pause duration invalid (${phases.topPause.duration}ms)`,
          path: ['repData', index, 'phases', 'topPause'],
        });
      }
    });
  }),

  workoutPlan: z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    exercises: z.array(z.object({
      exerciseType: z.enum(['squat', 'deadlift', 'bench_press']),
      sets: z.number().int().min(exercisePatterns.setParameters.minSets).max(exercisePatterns.setParameters.maxSets),
      reps: z.number().int().min(exercisePatterns.setParameters.minReps).max(exercisePatterns.setParameters.maxReps),
      restPeriod: z.number().int()
        .min(exercisePatterns.setParameters.minRestPeriod)
        .max(exercisePatterns.setParameters.maxRestPeriod),
      weight: z.number().min(0).max(1000).optional(),
      rpe: z.number().min(1).max(10).optional(),
      notes: z.string().max(1000).optional(),
    })).min(1),
    estimatedDuration: z.number().min(1).max(7200), // max 2 hours
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    tags: z.array(z.string()).max(5).optional(),
  }),

  advancedFormAnalysis: z.object({
    exerciseType: z.enum([
      EXERCISE_TYPES.SQUAT,
      EXERCISE_TYPES.DEADLIFT,
      EXERCISE_TYPES.BENCH_PRESS,
    ]),
    videoUrl: baseSchemas.url,
    metadata: z.object({
      duration: z.number().min(1),
      frameRate: z.number().min(1),
      resolution: z.object({
        width: z.number().min(1),
        height: z.number().min(1),
      }),
    }),
    keypoints: z.array(z.object({
      name: z.string(),
      confidence: z.number().min(0).max(1),
      position: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number().optional(),
      }),
      velocity: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number().optional(),
        magnitude: z.number(),
      }).optional(),
    })).min(1),
    segments: z.array(z.object({
      name: z.string(),
      startPoint: z.object({ x: z.number(), y: z.number() }),
      endPoint: z.object({ x: z.number(), y: z.number() }),
      angle: z.number(),
      length: z.number(),
    })).optional(),
    angles: z.array(z.object({
      name: z.string(),
      value: z.number(),
      confidence: z.number().min(0).max(1),
      velocity: z.number().optional(),
    })).optional(),
    barPath: z.object({
      points: z.array(z.object({
        x: z.number(),
        y: z.number(),
        time: z.number(),
      })),
      deviation: z.object({
        horizontal: z.number(),
        vertical: z.number(),
      }),
      velocity: z.object({
        peak: z.number(),
        average: z.number(),
        byPhase: z.object({
          eccentric: z.number(),
          concentric: z.number(),
        }),
      }),
    }).optional(),
  }).superRefine((data, ctx) => {
    // Get thresholds for specific exercise
    const thresholds = exercisePatterns.advancedFormValidation[data.exerciseType];

    // Validate bar path if present
    if (data.barPath) {
      validateBarPath(data.exerciseType, data.barPath, ctx);
    }

    // Validate velocities if present
    if (data.barPath?.velocity) {
      validateVelocities(data.exerciseType, data.barPath.velocity, ctx);
    }

    // Validate angles if present
    if (data.angles) {
      validateAdvancedAngles(data.exerciseType, data.angles, ctx);
    }

    // Validate segments if present
    if (data.segments) {
      validateSegments(data.exerciseType, data.segments, ctx);
    }
  }),

  progressionTracking: z.object({
    userId: z.string().uuid(),
    exerciseType: z.enum([
      EXERCISE_TYPES.SQUAT,
      EXERCISE_TYPES.DEADLIFT,
      EXERCISE_TYPES.BENCH_PRESS,
    ]),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    currentStats: z.object({
      maxWeight: z.number().min(0),
      bestFormScore: z.number().min(0).max(100),
      totalReps: z.number().min(0),
      totalSets: z.number().min(0),
      failedAttempts: z.number().min(0),
    }),
    lastSession: z.object({
      weight: z.number().min(0),
      reps: z.number().min(0),
      formScore: z.number().min(0).max(100),
      date: z.date(),
    }),
    progressionPlan: z.object({
      targetWeight: z.number().min(0),
      weightIncrement: z.number().min(0),
      deloadThreshold: z.number().min(0).max(100),
      minFormScore: z.number().min(0).max(100),
    }),
  }).superRefine((data, ctx) => {
    const thresholds = exercisePatterns.progressionThresholds[data.level];

    // Validate form score requirements
    if (data.currentStats.bestFormScore < thresholds.minFormScore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Form score below minimum requirement for ${data.level} level`,
        path: ['currentStats', 'bestFormScore'],
      });
    }

    // Validate weight progression
    const weightIncrease = (data.progressionPlan.targetWeight - data.lastSession.weight) / data.lastSession.weight;
    if (weightIncrease > thresholds.maxWeightIncrease) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Weight increase exceeds maximum for ${data.level} level`,
        path: ['progressionPlan', 'targetWeight'],
      });
    }

    // Validate failed attempts
    if (data.currentStats.failedAttempts > thresholds.maxFailedAttempts) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Too many failed attempts for ${data.level} level`,
        path: ['currentStats', 'failedAttempts'],
      });
    }
  }),
} as const;

// Helper functions for angle validation
function validateSquatAngles(angles: any[], ctx: z.RefinementCtx) {
  const thresholds = exercisePatterns.formValidation.squat;
  
  const kneeAngle = angles.find(a => a.name === 'knee');
  const hipAngle = angles.find(a => a.name === 'hip');
  const backAngle = angles.find(a => a.name === 'back');

  if (kneeAngle && Math.abs(kneeAngle.value) > thresholds.kneeAlignment) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Knee alignment exceeds threshold (${kneeAngle.value}°)`,
      path: ['angles'],
    });
  }

  if (backAngle && Math.abs(backAngle.value) > thresholds.backAngle) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Back angle exceeds threshold (${backAngle.value}°)`,
      path: ['angles'],
    });
  }
}

function validateDeadliftAngles(angles: any[], ctx: z.RefinementCtx) {
  const thresholds = exercisePatterns.formValidation.deadlift;
  
  const hipAngle = angles.find(a => a.name === 'hip');
  const backAngle = angles.find(a => a.name === 'back');

  if (hipAngle && hipAngle.value < thresholds.hipHinge) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Insufficient hip hinge (${hipAngle.value}°)`,
      path: ['angles'],
    });
  }

  if (backAngle && Math.abs(backAngle.value) > thresholds.backAngle) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Back angle exceeds threshold (${backAngle.value}°)`,
      path: ['angles'],
    });
  }
}

function validateBenchPressAngles(angles: any[], ctx: z.RefinementCtx) {
  const thresholds = exercisePatterns.formValidation.benchPress;
  
  const elbowAngle = angles.find(a => a.name === 'elbow');
  const wristAngle = angles.find(a => a.name === 'wrist');

  if (elbowAngle && elbowAngle.value < thresholds.elbowAngle) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Elbow angle too small (${elbowAngle.value}°)`,
      path: ['angles'],
    });
  }

  if (wristAngle && Math.abs(wristAngle.value) > thresholds.wristAlignment) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Wrist alignment exceeds threshold (${wristAngle.value}°)`,
      path: ['angles'],
    });
  }
}

// Helper functions for advanced validation
function validateBarPath(
  exerciseType: ExerciseType,
  barPath: any,
  ctx: z.RefinementCtx
) {
  const thresholds = exercisePatterns.advancedFormValidation[exerciseType];

  if (thresholds.barPath?.maxHorizontalDeviation !== undefined &&
      barPath.deviation.horizontal > thresholds.barPath.maxHorizontalDeviation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Bar path horizontal deviation exceeds threshold (${barPath.deviation.horizontal}cm)`,
      path: ['barPath', 'deviation'],
    });
  }
}

function validateVelocities(
  exerciseType: ExerciseType,
  velocity: any,
  ctx: z.RefinementCtx
) {
  const thresholds = exercisePatterns.velocityThresholds[exerciseType];

  if (velocity.byPhase.eccentric < thresholds.eccentric.range[0] || 
      velocity.byPhase.eccentric > thresholds.eccentric.range[1]) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Eccentric velocity outside optimal range (${velocity.byPhase.eccentric}m/s)`,
      path: ['barPath', 'velocity', 'byPhase', 'eccentric'],
    });
  }

  if (velocity.byPhase.concentric < thresholds.concentric.range[0] || 
      velocity.byPhase.concentric > thresholds.concentric.range[1]) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Concentric velocity outside optimal range (${velocity.byPhase.concentric}m/s)`,
      path: ['barPath', 'velocity', 'byPhase', 'concentric'],
    });
  }
}

function validateAdvancedAngles(
  exerciseType: ExerciseType,
  angles: any[],
  ctx: z.RefinementCtx
) {
  const thresholds = exercisePatterns.rangeOfMotion[exerciseType];

  angles.forEach((angle, index) => {
    const angleThresholds = thresholds[angle.name as keyof typeof thresholds];
    if (angleThresholds) {
      if (typeof angleThresholds.min === 'number' && angle.value < angleThresholds.min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${angle.name} angle below minimum (${angle.value}°)`,
          path: ['angles', index],
        });
      }
      if (typeof angleThresholds.max === 'number' && angle.value > angleThresholds.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${angle.name} angle exceeds maximum (${angle.value}°)`,
          path: ['angles', index],
        });
      }
    }
  });
}

function validateSegments(
  exerciseType: ExerciseType,
  segments: any[],
  ctx: z.RefinementCtx
) {
  const thresholds = exercisePatterns.advancedFormValidation[exerciseType];

  segments.forEach((segment, index) => {
    switch (exerciseType) {
      case EXERCISE_TYPES.SQUAT:
        validateSquatSegments(segment, thresholds, index, ctx);
        break;
      case EXERCISE_TYPES.DEADLIFT:
        validateDeadliftSegments(segment, thresholds, index, ctx);
        break;
      case EXERCISE_TYPES.BENCH_PRESS:
        validateBenchPressSegments(segment, thresholds, index, ctx);
        break;
    }
  });
}

function validateSquatSegments(segment: any, thresholds: any, index: number, ctx: z.RefinementCtx) {
  if (segment.name === 'knee' && Math.abs(segment.angle) > thresholds.kneeTrack.maxLateralDeviation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Knee tracking exceeds lateral deviation limit (${segment.angle}°)`,
      path: ['segments', index],
    });
  }
}

function validateDeadliftSegments(segment: any, thresholds: any, index: number, ctx: z.RefinementCtx) {
  if (segment.name === 'spine' && Math.abs(segment.angle) > thresholds.spineAngle.maxFlexion) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Spine flexion exceeds limit (${segment.angle}°)`,
      path: ['segments', index],
    });
  }
}

function validateBenchPressSegments(segment: any, thresholds: any, index: number, ctx: z.RefinementCtx) {
  if (segment.name === 'elbow' && 
     (segment.angle < thresholds.elbowPath.minTuck || segment.angle > thresholds.elbowPath.maxFlare)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Elbow angle outside acceptable range (${segment.angle}°)`,
      path: ['segments', index],
    });
  }
}

// API input schemas
export const apiSchemas = {
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),

  dateRange: z.object({
    startDate: baseSchemas.date,
    endDate: baseSchemas.date,
  }).refine(data => data.startDate <= data.endDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  }),

  search: z.object({
    query: z.string().min(1).max(100),
    filters: z.record(z.unknown()).optional(),
    includeArchived: z.boolean().optional(),
  }),
} as const;

// Sanitization functions
export const sanitize = {
  // Remove potentially dangerous HTML/JS
  text: (input: string) => {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .trim();
  },

  // Sanitize URLs
  url: (input: string) => {
    try {
      const url = new URL(input);
      // Only allow certain protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      return url.toString();
    } catch {
      return '';
    }
  },

  // Sanitize file names
  fileName: (input: string) => {
    return input
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .toLowerCase();
  },

  // Sanitize JSON input
  json: (input: unknown) => {
    if (typeof input !== 'string') return null;
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  },
} as const;

// Validation helper functions
export const validate = {
  // Validate with schema and return result
  async schema<T extends z.ZodType>(
    schema: T,
    data: unknown
  ): Promise<{ success: true; data: z.infer<T> } | { success: false; error: z.ZodError }> {
    try {
      const validData = await schema.parseAsync(data);
      return { success: true, data: validData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error };
      }
      throw error;
    }
  },

  // Get formatted error messages from ZodError
  getErrorMessages(error: z.ZodError): Record<string, string> {
    const errors: Record<string, string> = {};
    error.errors.forEach(err => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });
    return errors;
  },

  // Check if value matches pattern
  pattern(value: string, pattern: RegExp): boolean {
    return pattern.test(value);
  },

  // Check if value is within range
  range(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  },
} as const; 