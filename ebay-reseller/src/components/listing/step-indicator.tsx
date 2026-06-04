"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const steps = [
  { id: "photos", label: "Photos" },
  { id: "analysis", label: "Analysis" },
  { id: "market", label: "Market" },
  { id: "listing", label: "Listing" },
  { id: "profit", label: "Profit" },
  { id: "review", label: "Review" },
] as const;

interface StepIndicatorProps {
  currentStep: string;
  completedSteps: string[];
}

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="mb-6 overflow-x-auto pb-2">
      <div className="flex min-w-max items-center gap-1">
        {steps.map((step, index) => {
          const isComplete = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = index < currentIndex;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  isCurrent && "bg-primary text-primary-foreground shadow-sm",
                  isComplete && !isCurrent && "bg-green-500/15 text-green-700 dark:text-green-400",
                  !isCurrent && !isComplete && !isPast && "text-muted-foreground"
                )}
              >
                {(isComplete || isPast) && !isCurrent ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/20 text-[10px]">
                    {index + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-px w-4 sm:w-8",
                    index < currentIndex ? "bg-green-500" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
