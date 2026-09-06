"use client";

import React from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  completed: boolean;
}

interface OrderStepsProps {
  steps: Step[];
  className?: string;
}

export function OrderSteps({ steps, className = "" }: OrderStepsProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {steps.map((step, index) => (
        <div key={index} className="relative">
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "absolute -left-[39px] top-6 h-full w-0.5 bg-char/10",
                step.completed && "bg-lajvard"
              )}
            />
          )}

          <div className="flex items-start gap-4">
            {/* Step Indicator */}
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                step.completed
                  ? "border-lajvard bg-lajvard text-white"
                  : "border-char/20 bg-char/10 text-char-600 dark:text-char-400"
              )}
            >
              {step.completed ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <h3
                className={cn(
                  "font-semibold",
                  step.completed && "text-char-600 dark:text-char-400"
                )}
              >
                {step.title}
              </h3>
              {step.description && (
                <p className="mt-1 text-sm text-char-600 dark:text-char-400">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ProductDetailStep {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  order?: number;
}

interface ProductDetailStepsProps {
  steps: ProductDetailStep[];
  activeStep?: number;
  className?: string;
}

export function ProductDetailSteps({
  steps,
  activeStep = 1,
  className = "",
}: ProductDetailStepsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step) => (
        <div
          key={step.order}
          className={cn(
            "flex items-center gap-3 rounded-lg p-3 transition-colors",
            activeStep === step.order
              ? "bg-lajvard/10 text-lajvard dark:bg-lajvard/20"
              : "bg-char/5 text-char-600 dark:text-char-400"
          )}
        >
          {step.icon && <div className={cn("shrink-0", activeStep === step.order ? "text-lajvard" : "")}>{step.icon}</div>}
          <div className="flex-1">
            <h3 className="font-medium">{step.title}</h3>
            {step.description && (
              <p className="text-sm opacity-75">{step.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuickShopSteps({ className = "" }: { className?: string }) {
  const steps = [
    { title: "انتخاب محصول", completed: true },
    { title: "مشاهده مشخصات", completed: true },
    { title: "افزودن به سبد خرید", completed: false },
    { title: "تکمیل سفارش", completed: false },
  ];

  return (
    <OrderSteps
      steps={steps}
      className={cn(
        "border-t border-char/10 pt-6 mt-6",
        className
      )}
    />
  );
}