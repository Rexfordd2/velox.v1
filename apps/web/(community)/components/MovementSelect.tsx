"use client";
import * as React from 'react';

export type MovementOption = {
  id: string;
  name: string;
};

export function MovementSelect({
  value,
  onChange,
  options = [
    { id: 'squat', name: 'Squat' },
    { id: 'bench_press', name: 'Bench Press' },
    { id: 'deadlift', name: 'Deadlift' },
  ],
  placeholder = 'Select movement',
}: {
  value?: string;
  onChange?: (val: string) => void;
  options?: MovementOption[];
  placeholder?: string;
}) {
  return (
    <select
      className="border rounded px-3 py-2 w-full"
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.name}
        </option>
      ))}
    </select>
  );
}

export default MovementSelect;

 