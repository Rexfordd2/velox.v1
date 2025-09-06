"use client";

import React, { createContext, useContext } from 'react';

type SelectContextValue = {
  value?: string;
  onValueChange?: (value: string) => void;
};

const SelectContext = createContext<SelectContextValue>({});

export function Select({ value, onValueChange, children, className }: { value?: string; onValueChange?: (value: string) => void; children: React.ReactNode; className?: string; }) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <button type="button" className={className}>{children}</button>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useContext<SelectContextValue>(SelectContext);
  return <span>{value || placeholder || ''}</span>;
}

export function SelectContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function SelectItem({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { onValueChange } = useContext<SelectContextValue>(SelectContext);
  return (
    <div
      role="option"
      className={className}
      onClick={() => onValueChange && onValueChange(value)}
    >
      {children}
    </div>
  );
}

export default Select;


