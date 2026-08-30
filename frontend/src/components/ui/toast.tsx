"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

export interface ToastData {
  id: number;
  message: string;
  tone?: "success" | "error";
}

export function ToastStack({ toasts }: { toasts: ToastData[] }) {
  const prefersReduced = useReducedMotion();
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-[70] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:left-4 sm:translate-x-0"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: prefersReduced ? 0 : 0.18 }}
            className={
              "flex items-center gap-2 rounded-wobble px-4 py-3 shadow-lifted backdrop-blur " +
              (t.tone === "error"
                ? "bg-clay/95 text-white"
                : "bg-char/90 text-slip dark:bg-black/85")
            }
          >
            {t.tone === "error" ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            <p className="text-sm">{t.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
