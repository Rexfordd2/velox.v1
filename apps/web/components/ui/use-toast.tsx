"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";

type Toast = {
  id: string;
  title?: string;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
};

const ToastContext = React.createContext<{
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <Toaster/>");
  return ctx;
}

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...t }]);
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      <ToastPrimitives.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastPrimitives.Root
            key={t.id}
            className={`fixed right-4 top-4 z-50 mb-2 w-80 rounded border p-3 shadow-sm bg-white ${
              t.variant === "destructive" ? "border-red-300" : "border-gray-200"
            }`}
            duration={5000}
            onOpenChange={(open) => !open && dismiss(t.id)}
            open
          >
            {t.title && (
              <div className="font-medium">
                {t.title}
              </div>
            )}
            {t.description && (
              <div className="mt-1 text-sm text-gray-600">{t.description}</div>
            )}
            <ToastPrimitives.Close className="absolute right-2 top-2 text-gray-500">
              ×
            </ToastPrimitives.Close>
          </ToastPrimitives.Root>
        ))}
        <ToastPrimitives.Viewport />
      </ToastPrimitives.Provider>
    </ToastContext.Provider>
  );
}



