// app/(client)/auth/register/RegistrationSuccess.jsx
import { CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function RegistrationSuccess({ role, needsApproval = false }) {
  if (needsApproval) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-blue-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Registration Submitted!
        </h2>
        
        <p className="text-gray-600 mb-6">
          Your recruiter account has been created successfully. However, you need admin approval before you can access the recruiting dashboard.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• An admin will review your registration</li>
            <li>• You'll receive an email once approved</li>
            <li>• Then you can access the recruiting dashboard</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link href="/auth/recruiter-approval" className="btn btn-primary w-full">
            Complete Your Request
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/auth/login" className="btn btn-secondary w-full">
            Back to Login
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Registration Successful!
      </h2>
      
      <p className="text-gray-600 mb-6">
        Your account has been created successfully. You can now sign in and start using the platform.
      </p>

      <Link href="/auth/login" className="btn btn-primary w-full">
        Sign In Now
        <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  )
}