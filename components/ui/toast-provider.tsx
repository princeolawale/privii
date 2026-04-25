"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { CheckCircle2, X } from "lucide-react";

type Toast = {
  id: number;
  message: string;
};

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2400);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <div className="flex w-full max-w-md flex-col gap-3">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center justify-between rounded-2xl border border-border bg-card/95 px-4 py-3 text-sm text-primary shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                {toast.message}
              </span>
              <button
                aria-label="Dismiss toast"
                className="text-secondary transition hover:text-primary"
                onClick={() =>
                  setToasts((current) =>
                    current.filter((item) => item.id !== toast.id)
                  )
                }
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
