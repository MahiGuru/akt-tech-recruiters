import { CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function StepProgress({ totalSteps, currentStep }) {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalSteps }, (_, idx) => {
          const stepNumber = idx + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep
          return (
            <div key={stepNumber} className="flex items-center">
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isActive
                    ? 'bg-primary-500 text-white shadow-lg scale-110'
                    : 'bg-secondary-200 text-secondary-500'
              }`}>
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : stepNumber}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary-300"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              {stepNumber < totalSteps && (
                <div className={`w-8 h-1 mx-2 rounded transition-all duration-300 ${stepNumber < currentStep ? 'bg-green-500' : 'bg-secondary-200'}`}></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}