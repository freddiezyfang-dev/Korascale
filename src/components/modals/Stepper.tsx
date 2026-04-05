'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

const brandGreen = 'bg-[#1e3b32]';

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
}) => {
  return (
    <div className="mb-8 flex w-full max-w-xl mx-auto items-center justify-center">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <React.Fragment key={stepNumber}>
            {/* 步骤圆圈：relative + z-10，确保数字与连线重叠时在上层 */}
            <div className="relative z-10 flex shrink-0 flex-col items-center">
              <div
                className={`
                  relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium tabular-nums transition-colors duration-200
                  ${
                    isCompleted
                      ? `${brandGreen} text-white`
                      : isCurrent
                        ? 'bg-neutral-900 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 stroke-[2.5]" aria-hidden />
                ) : (
                  <span className="leading-none">{stepNumber}</span>
                )}
              </div>
              <span
                className={`
                  mt-2 max-w-[5.5rem] text-center text-xs font-medium
                  ${
                    isCompleted || isCurrent
                      ? 'text-[#1e3b32]'
                      : 'text-gray-400'
                  }
                `}
              >
                {stepLabels[index]}
              </span>
            </div>

            {/* 背景连接线：z-0，低于步骤圆 */}
            {stepNumber < totalSteps && (
              <div
                className={`
                  relative z-0 mx-2 h-0.5 min-h-[2px] min-w-[0.75rem] flex-1 self-center transition-colors duration-200 sm:mx-4
                  ${isCompleted ? brandGreen : 'bg-gray-200'}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};


























