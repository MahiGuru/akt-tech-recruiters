'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  User, 
  Building, 
  ArrowRight,
  CheckCircle,
  Users,
  Briefcase
} from 'lucide-react'
import Image from 'next/image'

export default function RoleSelection() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
    
    // If user already has a role, redirect to dashboard
    if (session?.user?.role && session.user.role !== 'EMPLOYEE') {
      if (session.user.role === 'EMPLOYER') {
        router.push('/dashboard/employer')
      } else {
        router.push('/dashboard/employee')
      }
    }
  }, [session, status, router])

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast.error('Please select a role')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: session.user.id,
          role: selectedRole 
        })
      })

      if (response.ok) {
        // Update the session
        await update({ role: selectedRole })
        
        toast.success('Welcome to At Bench!')
        
        // Redirect based on role
        if (selectedRole === 'EMPLOYER') {
          router.push('/dashboard/employer')
        } else {
          router.push('/dashboard/employee')
        }
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to set role')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const roleOptions = [
    {
      value: 'EMPLOYEE',
      title: 'Job Seeker',
      description: 'Find your dream job',
      icon: User,
      gradient: 'from-blue-500 to-cyan-500',
      benefits: ['Browse thousands of jobs', 'Upload multiple resumes', 'Track applications', 'Get discovered by employers']
    },
    {
      value: 'EMPLOYER',
      title: 'Employer',
      description: 'Hire top talent',
      icon: Building,
      gradient: 'from-purple-500 to-pink-500',
      benefits: ['Post unlimited jobs', 'Access talent pool', 'Manage applications', 'Build your team']
    }
  ]

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-primary-400 to-purple-600 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative max-w-2xl w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image src="/logo.svg" alt="At Bench Logo" width={300} height={120} />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold text-secondary-900 mb-3">
              Welcome {session.user.name}!
            </h1>
            <p className="text-secondary-600 text-lg">
              Let's set up your account. Are you looking for a job or looking to hire?
            </p>
          </motion.div>
        </div>

        <div className="card shadow-2xl border-0 bg-white/90 backdrop-blur-xl">
          {/* Role Selection */}
          <fieldset className="mb-8">
            <legend className="form-label mb-6 text-center text-lg font-semibold">
              Choose your path
            </legend>
            <div className="grid grid-cols-1 gap-6">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedRole(option.value)}
                  className={`relative p-6 border-2 rounded-2xl transition-all duration-300 text-left group ${
                    selectedRole === option.value 
                      ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-purple-50 shadow-lg scale-[1.02]' 
                      : 'border-secondary-200 hover:border-primary-300 hover:shadow-md hover:scale-[1.01]'
                  }`}
                  aria-pressed={selectedRole === option.value}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${option.gradient} flex items-center justify-center shadow-lg`}>
                      <option.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-secondary-900 mb-2 text-xl">{option.title}</h3>
                      <p className="text-secondary-600 mb-4">{option.description}</p>
                      <ul className="space-y-2">
                        {option.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-secondary-600">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {selectedRole === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center"
                      >
                        <CheckCircle className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Continue Button */}
          <button
            onClick={handleRoleSelection}
            disabled={!selectedRole || isLoading}
            className="btn btn-primary w-full py-4 text-lg font-semibold"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner w-5 h-5" />
                Setting up your account...
              </>
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Trust Indicators */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-sm text-secondary-500 mb-4">Trusted by 50,000+ professionals</p>
          <div className="flex justify-center items-center gap-6 opacity-60">
            <div className="text-xs text-secondary-400">🔒 Secure</div>
            <div className="text-xs text-secondary-400">⚡ Fast</div>
            <div className="text-xs text-secondary-400">✨ Simple</div>
            <div className="text-xs text-secondary-400">🎯 Effective</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}