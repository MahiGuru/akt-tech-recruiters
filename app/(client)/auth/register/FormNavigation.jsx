import { ArrowLeft, Zap } from 'lucide-react'

export default function FormNavigation({ isLoading, prevStep }) {
  return (
    <div className="flex gap-3 pt-6">
      <button
        type="button"
        onClick={prevStep}
        className="btn btn-secondary flex-1 py-4"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary flex-1 py-4 text-lg font-semibold"
      >
        {isLoading ? (
          <>
            <div className="loading-spinner mr-2" />
            Creating Account...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 mr-2" />
            Create Account
          </>
        )}
      </button>
    </div>
  )
}