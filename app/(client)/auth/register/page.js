'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import StepProgress from './StepProgress'
import RoleSelector from './RoleSelector'
import BasicInfoForm from './BasicInfoForm'
import ContactDetailsForm from './ContactDetailsForm'
import PasswordForm from './PasswordForm'
import FormNavigation from './FormNavigation'
import FooterLinks from './FooterLinks'
import RegistrationSuccess from './RegistrationSuccess'

export default function Register() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    }>
      <RegisterPage />
    </Suspense>
  )
}

function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState(searchParams.get('role') || 'EMPLOYEE')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [needsApproval, setNeedsApproval] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, watch, trigger } = useForm({
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: ''
    }
  })
  
  const password = watch('password')
  const totalSteps = role === 'EMPLOYER' || role === 'RECRUITER' ? 4 : 3

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const submitData = { 
        ...data, 
        role,
        // All recruiters who register are automatically admins
        ...(role === 'RECRUITER' && { 
          recruiterType: 'ADMIN',
          selectedAdmin: null // No admin needed since they are the admin
        }) 
      }
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.needsApproval) {
          toast.success('🎉 Registration successful! Approval required.')
          setNeedsApproval(true)
        } else {
          if (role === 'RECRUITER') {
            toast.success('🎉 Welcome to At Bench! Your admin account is ready.')
          } else {
            toast.success('🎉 Registration successful! Welcome!')
          }
        }
        
        setRegistrationComplete(true)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = async () => {
    let fieldsToValidate = []
    
    // Step 1: Role selection - no validation needed, just role selection
    if (currentStep === 1) {
      if (!role) {
        toast.error('Please select your account type')
        return
      }
      setCurrentStep(currentStep + 1)
      return
    }
    
    // Step 2: Basic info (name, email)
    if (currentStep === 2) {
      fieldsToValidate = ['name', 'email']
    } 
    // Step 3: Contact details and role-specific info
    else if (currentStep === 3) {
      fieldsToValidate = ['phone']
      
      // Add role-specific required fields
      if (role === 'EMPLOYER') {
        fieldsToValidate.push('companyName', 'companySize', 'industry')
      }
    }
    
    // Validate the current step's fields
    const isValid = await trigger(fieldsToValidate)
    
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else if (!isValid) {
      // Show validation errors
      const firstError = Object.keys(errors)[0]
      if (firstError) {
        toast.error(`Please fix the ${firstError} field`)
      }
    }
  }
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-6 px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-primary-400 to-purple-600 rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full opacity-5 blur-3xl"></div>
      </div>

      <div className="relative max-w-2xl w-full space-y-4">
        {!registrationComplete && (
          <StepProgress totalSteps={totalSteps} currentStep={currentStep} />
        )}
        
        <div className="card shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
          {registrationComplete ? (
            <RegistrationSuccess role={role} needsApproval={needsApproval} />
          ) : (
            <>
              {currentStep === 1 && (
                <RoleSelector 
                  role={role} 
                  setRole={setRole} 
                  nextStep={nextStep}
                />
              )}
              
              {currentStep === 2 && (
                <BasicInfoForm
                  register={register}
                  errors={errors}
                  isLoading={isLoading}
                  nextStep={nextStep}
                  watch={watch} // Pass watch function for real-time validation
                />
              )}
              
              {currentStep === 3 && (
                <ContactDetailsForm
                  role={role}
                  register={register}
                  errors={errors}
                  isLoading={isLoading}
                  nextStep={nextStep}
                  prevStep={prevStep}
                  watch={watch} // Pass watch function for real-time validation
                />
              )}
              
              {currentStep === totalSteps && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <PasswordForm
                    register={register}
                    errors={errors}
                    isLoading={isLoading}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    password={password}
                  />
                  <FormNavigation
                    isLoading={isLoading}
                    prevStep={prevStep}
                  />
                </form>
              )}
              
              {!registrationComplete && <FooterLinks />}
            </>
          )}
        </div>

        {/* Trust indicators */}
        {!registrationComplete && (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">Trusted by 50,000+ professionals worldwide</p>
            <div className="flex justify-center items-center gap-6 opacity-60">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>🔒</span> Secure & Encrypted
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>⚡</span> Quick Setup
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>✨</span> Free to Use
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>🎯</span> Results Driven
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}