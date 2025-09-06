import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className = '', ...props }, ref) => (
  <div ref={ref} className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`} {...props} />
));

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="border-b p-4">{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500">{children}</p>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>;
}


