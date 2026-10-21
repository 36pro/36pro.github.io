import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-[90vw] sm:max-w-md pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          const isInfo = toast.type === 'info';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-[var(--radius)] border shadow-xl backdrop-blur-md text-sm font-medium ${
                isError
                  ? 'bg-danger/15 text-danger border-danger/30'
                  : isWarning
                  ? 'bg-warning/15 text-warning border-warning/30'
                  : isInfo
                  ? 'bg-accent/15 text-accent border-accent/30'
                  : 'bg-surface text-foreground border-border shadow-black/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isError ? (
                  <AlertCircle size={18} className="shrink-0 text-danger" />
                ) : isWarning ? (
                  <AlertTriangle size={18} className="shrink-0 text-warning" />
                ) : isInfo ? (
                  <Info size={18} className="shrink-0 text-accent" />
                ) : (
                  <CheckCircle2 size={18} className="shrink-0 text-success" />
                )}
                <span className="leading-tight text-xs sm:text-sm">{toast.message}</span>
              </div>
              <button
                type="button"
                className="text-muted hover:text-foreground shrink-0 p-1"
                onClick={() => removeToast(toast.id)}
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
