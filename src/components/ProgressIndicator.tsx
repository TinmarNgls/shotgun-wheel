interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  return (
    <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-6 sm:mb-8 px-4 overflow-x-auto">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        
        return (
          <div key={stepNumber} className="flex items-center">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300 flex-shrink-0 ${
                isCompleted
                  ? 'bg-success text-success-foreground'
                  : isCurrent
                  ? 'bg-primary text-primary-foreground animate-pulse-glow'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isCompleted ? '✓' : stepNumber}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`w-4 sm:w-8 h-0.5 sm:h-1 mx-1 sm:mx-2 transition-all duration-300 ${
                  isCompleted ? 'bg-success' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};