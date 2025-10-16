'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
}) => {
  return (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isUpcoming = stepNumber > currentStep;

        return (
          <React.Fragment key={stepNumber}>
            {/* 步骤圆圈 */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200
                  ${
                    isCompleted
                      ? 'bg-accent text-white'
                      : isCurrent
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={`
                  mt-2 text-xs font-medium text-center max-w-20
                  ${
                    isCompleted || isCurrent
                      ? 'text-primary'
                      : 'text-gray-400'
                  }
                `}
              >
                {stepLabels[index]}
              </span>
            </div>

            {/* 连接线 */}
            {stepNumber < totalSteps && (
              <div
                className={`
                  flex-1 h-0.5 mx-4 transition-colors duration-200
                  ${
                    isCompleted
                      ? 'bg-accent'
                      : 'bg-gray-200'
                  }
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};














