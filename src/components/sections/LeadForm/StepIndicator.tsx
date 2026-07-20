export function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="step-indicator" aria-label={`Step ${currentStep + 1} of ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <span key={index} className={index <= currentStep ? 'active' : ''} />
      ))}
    </div>
  )
}
