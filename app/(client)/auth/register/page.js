'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  User,
  Building,
  Mail,
  Lock,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Zap,
  Users,
  IndianRupeeIcon,
  Clock,
  Globe,
  Briefcase
} from 'lucide-react'


/**
 * Register page with Suspence
 * As we are using useSerchParams()
 * @returns  - RegisterPage.
 */
export default function Register() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPage></RegisterPage>
    </Suspense>
  )
}


/***
 * Register page
 */
function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState(searchParams.get('role') || 'EMPLOYEE')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const { register, handleSubmit, formState: { errors }, watch, trigger } = useForm()

  const password = watch('password')
  const totalSteps = role === 'EMPLOYER' ? 3 : 2

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, role })
      })

      if (response.ok) {
        toast.success('🎉 Registration successful! Welcome to AtBench!')
        router.push('/auth/login')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Registration failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = async () => {
    let fieldsToValidate = []

    if (currentStep === 1) {
      fieldsToValidate = ['name', 'email']
    } else if (currentStep === 2 && role === 'EMPLOYEE') {
      fieldsToValidate = ['phone', 'location']
    } else if (currentStep === 2 && role === 'EMPLOYER') {
      fieldsToValidate = ['phone', 'companyName', 'companySize', 'industry']
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
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

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: '', color: '' }

    let strength = 0
    if (password.length >= 6) strength++
    if (password.match(/[a-z]/)) strength++
    if (password.match(/[A-Z]/)) strength++
    if (password.match(/[0-9]/)) strength++
    if (password.match(/[^a-zA-Z0-9]/)) strength++

    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Very Weak', color: 'bg-red-500' },
      { strength: 2, label: 'Weak', color: 'bg-orange-500' },
      { strength: 3, label: 'Fair', color: 'bg-yellow-500' },
      { strength: 4, label: 'Good', color: 'bg-blue-500' },
      { strength: 5, label: 'Strong', color: 'bg-green-500' }
    ]

    return levels[strength]
  }

  const passwordStrength = getPasswordStrength()

  return (
    <Suspense fallback={<div>Loading...</div>}>
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
          className="relative max-w-lg w-full space-y-8"
        >
          {/* Header */}
          <div className="text-center">

            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl font-bold text-secondary-900 mb-3">
                Join At Bench Today
              </h1>
              <p className="text-secondary-600 text-lg">
                Connect with opportunities that matter
              </p>
            </motion.div> */}
          </div>

          {/* Enhanced Progress Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalSteps }, (_, index) => {
                const stepNumber = index + 1
                const isActive = stepNumber === currentStep
                const isCompleted = stepNumber < currentStep

                return (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-primary-500 text-white shadow-lg scale-110'
                          : 'bg-secondary-200 text-secondary-500'
                      }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        stepNumber
                      )}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-primary-300"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                    {stepNumber < totalSteps && (
                      <div className={`w-8 h-1 mx-2 rounded transition-all duration-300 ${stepNumber < currentStep ? 'bg-green-500' : 'bg-secondary-200'
                        }`}></div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card shadow-2xl border-0 bg-white/90 backdrop-blur-xl">
            {/* Step 1: Role Selection & Basic Info */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {/* Role Selection */}
                <fieldset className="mb-8">
                  {/* <legend className="form-label mb-6 text-center text-lg font-semibold">
                    Choose your path
                  </legend> */}
                  <div className="grid grid-cols-1 gap-4">
                    {roleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value)}
                        className={`relative p-6 border-2 rounded-2xl transition-all duration-300 text-left group ${role === option.value
                            ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-purple-50 shadow-lg scale-[1.02]'
                            : 'border-secondary-200 hover:border-primary-300 hover:shadow-md hover:scale-[1.01]'
                          }`}
                        aria-pressed={role === option.value}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${option.gradient} flex items-center justify-center shadow-lg`}>
                            <option.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-secondary-900 mb-1">{option.title}</h3>
                            <p className="text-secondary-600 text-sm mb-3">{option.description}</p>
                            <ul className="space-y-1">
                              {option.benefits.slice(0, 2).map((benefit, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-xs text-secondary-600">
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {role === option.value && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                            >
                              <CheckCircle className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label required text-secondary-800">
                      Full Name
                    </label>
                    <div className="input-with-icon">
                      <input
                        id="name"
                        {...register('name', {
                          required: 'Name is required',
                          minLength: { value: 2, message: 'Name must be at least 2 characters' }
                        })}
                        className={`input-field transition-all duration-200 ${errors.name ? 'border-red-400 bg-red-50' : 'focus:border-primary-400 focus:bg-white'}`}
                        placeholder="Enter your full name"
                        aria-describedby={errors.name ? 'name-error' : undefined}
                      />
                      <User className="input-icon text-secondary-400" aria-hidden="true" />
                    </div>
                    {errors.name && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        id="name-error"
                        className="form-error"
                        role="alert"
                      >
                        {errors.name.message}
                      </motion.div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label required text-secondary-800">
                      Email Address
                    </label>
                    <div className="input-with-icon">
                      <input
                        id="email"
                        type="email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: 'Please enter a valid email address'
                          }
                        })}
                        className={`input-field transition-all duration-200 ${errors.email ? 'border-red-400 bg-red-50' : 'focus:border-primary-400 focus:bg-white'}`}
                        placeholder="Enter your email address"
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                      <Mail className="input-icon text-secondary-400" aria-hidden="true" />
                    </div>
                    {errors.email && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        id="email-error"
                        className="form-error"
                        role="alert"
                      >
                        {errors.email.message}
                      </motion.div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn btn-primary w-full py-4 text-lg font-semibold"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Contact & Company Details */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-secondary-900">
                      {role === 'EMPLOYEE' ? 'Contact Information' : 'Company Details'}
                    </h3>
                    <p className="text-secondary-600">
                      {role === 'EMPLOYEE'
                        ? 'Help us personalize your experience'
                        : 'Tell us about your company'
                      }
                    </p>
                  </div>

                  {/* Phone Number (Both roles) */}
                  <div className="form-group">
                    <label htmlFor="phone" className="form-label required text-secondary-800">
                      Phone Number
                    </label>
                    <div className="input-with-icon">
                      <input
                        id="phone"
                        type="tel"
                        {...register('phone', { required: 'Phone number is required' })}
                        className={`input-field transition-all duration-200 ${errors.phone ? 'border-red-400 bg-red-50' : 'focus:border-primary-400 focus:bg-white'}`}
                        placeholder="Enter your phone number"
                      />
                      <Phone className="input-icon text-secondary-400" aria-hidden="true" />
                    </div>
                    {errors.phone && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="form-error"
                        role="alert"
                      >
                        {errors.phone.message}
                      </motion.div>
                    )}
                  </div>

                  {role === 'EMPLOYEE' ? (
                    /* Employee Fields */
                    <div className="form-group">
                      <label htmlFor="location" className="form-label text-secondary-800">
                        Location
                      </label>
                      <div className="input-with-icon">
                        <input
                          id="location"
                          {...register('location')}
                          className="input-field focus:border-primary-400 focus:bg-white transition-all duration-200"
                          placeholder="Enter your city, state"
                        />
                        <MapPin className="input-icon text-secondary-400" aria-hidden="true" />
                      </div>
                    </div>
                  ) : (
                    /* Employer Fields */
                    <>
                      <div className="form-group">
                        <label htmlFor="companyName" className="form-label required text-secondary-800">
                          Company Name
                        </label>
                        <div className="input-with-icon">
                          <input
                            id="companyName"
                            {...register('companyName', { required: 'Company name is required' })}
                            className={`input-field transition-all duration-200 ${errors.companyName ? 'border-red-400 bg-red-50' : 'focus:border-primary-400 focus:bg-white'}`}
                            placeholder="Enter your company name"
                          />
                          <Building className="input-icon text-secondary-400" aria-hidden="true" />
                        </div>
                        {errors.companyName && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="form-error"
                            role="alert"
                          >
                            {errors.companyName.message}
                          </motion.div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                          <label htmlFor="companySize" className="form-label required text-secondary-800">
                            Company Size
                          </label>
                          <select
                            id="companySize"
                            {...register('companySize', { required: 'Company size is required' })}
                            className={`input-field transition-all duration-200 ${errors.companySize ? 'border-red-400 bg-red-50' : 'focus:border-primary-400 focus:bg-white'}`}
                          >
                            <option value="">Select size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="500+">500+ employees</option>
                          </select>
                          {errors.companySize && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="form-error"
                              role="alert"
                            >
                              {errors.companySize.message}
                            </motion.div>
                          )}
                        </div>

                        <div className="form-group">
                          <label htmlFor="industry" className="form-label required text-secondary-800">
                            Industry
                          </label>
                          <select
                            id="industry"
                            {...register('industry', { required: 'Industry is required' })}
                            className={`input-field transition-all duration-200 ${errors.industry ? 'border-red-400 bg-red-50' : 'focus:border-primary-400 focus:bg-white'}`}
                          >
                            <option value="">Select industry</option>
                            <option value="technology">Technology</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="finance">Finance</option>
                            <option value="education">Education</option>
                            <option value="retail">Retail</option>
                            <option value="manufacturing">Manufacturing</option>
                            <option value="consulting">Consulting</option>
                            <option value="other">Other</option>
                          </select>
                          {errors.industry && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="form-error"
                              role="alert"
                            >
                              {errors.industry.message}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Navigation Buttons */}
                  {((role === 'EMPLOYER' && currentStep === 2)) ? (
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
                      type="button"
                      onClick={nextStep}
                      className="btn btn-primary flex-1 py-4"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>) : null }
                </div> 
              </motion.div>
            )}

            {/* Step 3: Password & Final Details (Employer) or Step 2 (Employee) */}
            {((role === 'EMPLOYER' && currentStep === 3) || (role === 'EMPLOYEE' && currentStep === 2)) && (
              <motion.div
                key="final-step"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-secondary-900">
                      {role === 'EMPLOYER' ? 'Hiring Preferences & Security' : ''}
                    </h3>
                    <p className="text-secondary-600">
                      {role === 'EMPLOYER'
                        ? 'Help us match you with the right candidates'
                        : ''
                      }
                    </p>
                  </div>

                  {/* Employer-specific final fields */}
                  {role === 'EMPLOYER' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                          <label htmlFor="urgency" className="form-label text-secondary-800">
                            Hiring Urgency
                          </label>
                          <div className="input-with-icon">
                            <select
                              id="urgency"
                              {...register('urgency')}
                              className="input-field focus:border-primary-400 focus:bg-white transition-all duration-200"
                            >
                              <option value="">Select urgency</option>
                              <option value="immediate">Immediate (1-2 weeks)</option>
                              <option value="soon">Soon (1 month)</option>
                              <option value="flexible">Flexible (2-3 months)</option>
                              <option value="planning">Just planning</option>
                            </select>
                            <Clock className="input-icon text-secondary-400" aria-hidden="true" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="budgetRange" className="form-label text-secondary-800">
                            Budget Range
                          </label>
                          <div className="input-with-icon">
                            <select
                              id="budgetRange"
                              {...register('budgetRange')}
                              className="input-field focus:border-primary-400 focus:bg-white transition-all duration-200"
                            >
                              <option value="">Select range</option>
                              <option value="under-50k">Under $50K</option>
                              <option value="50k-100k">$50K - $100K</option>
                              <option value="100k-150k">$100K - $150K</option>
                              <option value="150k-200k">$150K - $200K</option>
                              <option value="200k+">$200K+</option>
                            </select>
                            <IndianRupeeIcon className="input-icon text-secondary-400" aria-hidden="true" />
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="companyLocation" className="form-label text-secondary-800">
                          Company Location
                        </label>
                        <div className="input-with-icon">
                          <input
                            id="companyLocation"
                            {...register('companyLocation')}
                            className="input-field focus:border-primary-400 focus:bg-white transition-all duration-200"
                            placeholder="City, State or Remote"
                          />
                          <Globe className="input-icon text-secondary-400" aria-hidden="true" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Password Field */}
                  <div className="form-group">
                    <label htmlFor="password" className="form-label required text-secondary-800">
                      Create Password
                    </label>
                    <div className="input-with-icon">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        {...register('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters'
                          }
                        })}
                        className={`input-field pr-12 transition-all duration-200 ${errors.password ? 'border-red-400 bg-red-50' : 'focus:border-primary-400 focus:bg-white'}`}
                        placeholder="Create a secure password"
                        aria-describedby={errors.password ? 'password-error' : 'password-help'}
                      />
                      <Lock className="input-icon text-secondary-400" aria-hidden="true" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="show-password-icon absolute text-secondary-400 hover:text-secondary-600 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 bg-secondary-200 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            />
                          </div>
                          <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {errors.password ? (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        id="password-error"
                        className="form-error"
                        role="alert"
                      >
                        {errors.password.message}
                      </motion.div>
                    ) : (
                      <div id="password-help" className="text-xs text-secondary-500 mt-1">
                        Use at least 6 characters with a mix of letters and numbers
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
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
                          <div className="loading-spinner mr-2" aria-hidden="true" />
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
                </form>
              </motion.div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-secondary-600">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-semibold text-primary-600 hover:text-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                >
                  Sign in here
                </Link>
              </p>
              <p className="text-xs text-secondary-500 mt-4">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-secondary-700">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="underline hover:text-secondary-700">Privacy Policy</Link>
              </p>
            </div>
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
              <div className="text-xs text-secondary-400">🔒 Find</div>
              <div className="text-xs text-secondary-400">⚡ Post</div>
              <div className="text-xs text-secondary-400">✨ Apply</div>
              <div className="text-xs text-secondary-400">✨ Success</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Suspense>
  )
}