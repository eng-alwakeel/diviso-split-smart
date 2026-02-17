import React from 'react';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  step?: number;
  totalSteps?: number;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children, step, totalSteps = 4 }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Progress dots */}
      {step !== undefined && step > 0 && (
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i + 1 === step
                  ? 'w-8 bg-primary'
                  : i + 1 < step
                  ? 'w-2 bg-primary/60'
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {children}
      </div>
    </div>
  );
};
