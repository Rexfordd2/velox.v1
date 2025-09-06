export type RangeBucket = {
  label: string;
  min: number; // inclusive
  max: number; // exclusive, unless Infinity
};

export const AgeBuckets: RangeBucket[] = [
  { label: '13-17', min: 13, max: 18 },
  { label: '18-24', min: 18, max: 25 },
  { label: '25-34', min: 25, max: 35 },
  { label: '35-44', min: 35, max: 45 },
  { label: '45-54', min: 45, max: 55 },
  { label: '55-64', min: 55, max: 65 },
  { label: '65+', min: 65, max: Infinity }
];

export const BodyWeightBucketsKg: RangeBucket[] = [
  { label: 'Under 60', min: 0, max: 60 },
  { label: '60-69.9', min: 60, max: 70 },
  { label: '70-79.9', min: 70, max: 80 },
  { label: '80-89.9', min: 80, max: 90 },
  { label: '90-99.9', min: 90, max: 100 },
  { label: '100-109.9', min: 100, max: 110 },
  { label: '110-124.9', min: 110, max: 125 },
  { label: '125+', min: 125, max: Infinity }
];

export const ExperienceBuckets: RangeBucket[] = [
  { label: 'novice', min: 0, max: 1 }, // <1 year
  { label: 'intermediate', min: 1, max: 3 },
  { label: 'advanced', min: 3, max: 5 },
  { label: 'elite', min: 5, max: Infinity }
];

export type Profile = {
  age: number;
  bodyWeightKg: number;
  experienceYears?: number;
  experience?: string; // optional label override
};

function findBucketLabel(buckets: RangeBucket[], value: number): string {
  for (const b of buckets) {
    if (value >= b.min && value < b.max) return b.label;
  }
  // If not found due to unexpected values, fall back to the last bucket
  return buckets[buckets.length - 1]?.label ?? '';
}

function normalizeExperienceLabel(label: string | undefined): string | undefined {
  if (!label) return undefined;
  const key = label.trim().toLowerCase();
  const known = ExperienceBuckets.map(b => b.label);
  return known.includes(key) ? key : undefined;
}

export function assignBuckets(profile: Profile): { age: string; bodyWeightKg: string; experience: string } {
  const ageLabel = findBucketLabel(AgeBuckets, Number(profile.age));
  const weightLabel = findBucketLabel(BodyWeightBucketsKg, Number(profile.bodyWeightKg));

  const explicitLabel = normalizeExperienceLabel(profile.experience);
  let experienceLabel: string;
  if (explicitLabel) {
    experienceLabel = explicitLabel;
  } else if (Number.isFinite(profile.experienceYears as number)) {
    experienceLabel = findBucketLabel(ExperienceBuckets, Number(profile.experienceYears));
  } else {
    experienceLabel = 'novice';
  }

  return {
    age: ageLabel,
    bodyWeightKg: weightLabel,
    experience: experienceLabel
  };
}
