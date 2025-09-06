import * as React from 'react'

export function Accordion({ children, value, onValueChange, type }: { children: React.ReactNode; value?: string | null; onValueChange?: (v: string | null) => void; type?: 'single' | 'multiple' }) {
  return <div>{children}</div>
}
export function AccordionItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <div data-value={value}>{children}</div>
}
export function AccordionTrigger({ children, className, ...rest }: React.HTMLAttributes<HTMLButtonElement>) {
  return <button className={className} {...rest}>{children}</button>
}
export function AccordionContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
