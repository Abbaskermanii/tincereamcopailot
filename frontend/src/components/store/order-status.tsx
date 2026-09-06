"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle, Package, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  title: string;
  completed: boolean;
  icon: React.ReactNode;
  info?: string;
}

interface StatusConfig {
  status: string;
  timeline: TimelineStep[];
}

interface OrderStatusProps {
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  orderNumber?: string;
  className?: string;
}

export function OrderStatus({ status, orderNumber, className = "" }: OrderStatusProps) {
  const config = getOrderStatusConfig(status);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Status Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-char-800 dark:text-char-200">
          سفارش شما تایید شد
        </h2>
        <p className="mt-2 text-char-600 dark:text-char-400">
          سفارش #{orderNumber} با موفقیت ثبت شد.
        </p>
      </div>

      {/* Status Timeline */}
      <div className="space-y-4">
        {config.timeline.map((step, index) => (
          <div key={index} className="relative">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  step.completed
                    ? "border-lajvard bg-lajvard text-white"
                    : "border-char/20 bg-char/10 text-char-600 dark:text-char-400"
                )}
              >
                {step.icon}
              </div>

              <div className="flex-1">
                <h3
                  className={cn(
                    "font-medium",
                    step.completed
                      ? "text-char-700 dark:text-char-300"
                      : "text-char-500 dark:text-char-500"
                  )}
                >
                  {step.title}
                </h3>
              </div>

              {step.completed && step.info && (
                <div className="hidden text-right sm:block">
                  <p className="text-sm text-char-600 dark:text-char-400">
                    {step.info}
                  </p>
                </div>
              )}
            </div>

            <div
              className={cn(
                "absolute -left-[41px] top-12 h-full w-0.5 bg-char/10 transition-colors",
                step.completed && "bg-lajvard"
              )}
            />
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-char-700 dark:text-char-300 hover:bg-char/10 dark:hover:bg-white/10 transition-colors"
        >
          ادامه خرید
        </Link>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-char-700 dark:text-char-300 hover:bg-char/10 dark:hover:bg-white/10 transition-colors"
        >
          مشاهده سفارشات
        </Link>
      </div>
    </div>
  );
}

function getOrderStatusConfig(status: string): StatusConfig {
  const configs: Record<string, StatusConfig> = {
    pending: {
      status: "در انتظار تایید",
      timeline: [
        { title: "ثبت سفارش", completed: true, icon: <CheckCircle size={20} /> },
        { title: "تایید نهایی", completed: true, icon: <CheckCircle size={20} /> },
        { title: "پردازش و آماده‌سازی", completed: true, icon: <Clock size={20} /> },
        { title: "ارسال", completed: false, icon: <Package size={20} /> },
        { title: "تحویل", completed: false, icon: <Package size={20} /> },
      ],
    },
    processing: {
      status: "در حال پردازش",
      timeline: [
        { title: "ثبت سفارش", completed: true, icon: <CheckCircle size={20} /> },
        { title: "تایید نهایی", completed: true, icon: <CheckCircle size={20} /> },
        { title: "پردازش و آماده‌سازی", completed: true, icon: <Clock size={20} /> },
        { title: "ارسال", completed: false, icon: <Package size={20} /> },
        { title: "تحویل", completed: false, icon: <Package size={20} /> },
      ],
    },
    shipped: {
      status: "در حال ارسال",
      timeline: [
        { title: "ثبت سفارش", completed: true, icon: <CheckCircle size={20} /> },
        { title: "تایید نهایی", completed: true, icon: <CheckCircle size={20} /> },
        { title: "پردازش و آماده‌سازی", completed: true, icon: <Clock size={20} /> },
        { title: "ارسال", completed: true, icon: <Package size={20} /> },
        { title: "تحویل", completed: false, icon: <Package size={20} /> },
      ],
    },
    delivered: {
      status: "تحویل شده",
      timeline: [
        { title: "ثبت سفارش", completed: true, icon: <CheckCircle size={20} /> },
        { title: "تایید نهایی", completed: true, icon: <CheckCircle size={20} /> },
        { title: "پردازش و آماده‌سازی", completed: true, icon: <Clock size={20} /> },
        { title: "ارسال", completed: true, icon: <Package size={20} /> },
        { title: "تحویل", completed: true, icon: <Package size={20} /> },
      ],
    },
    cancelled: {
      status: "لغو شده",
      timeline: [
        { title: "ثبت سفارش", completed: true, icon: <Package size={20} /> },
        { title: "تایید نهایی", completed: true, icon: <Package size={20} /> },
        { title: "پردازش", completed: true, icon: <Package size={20} /> },
        { title: "ارسال", completed: true, icon: <Package size={20} /> },
      ],
    },
  };

  return configs[status] ?? { status: "نامشخص", timeline: [] };
}