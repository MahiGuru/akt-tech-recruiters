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

//Loading..
export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState(searchParams.get('role') || 'EMPLOYEE')
  const [recruiterType, setRecruiterType] = useState('TA')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const { register, handleSubmit, formState: { errors }, watch, trigger } = useForm()
  const password = watch('password')
  const totalSteps = role === 'EMPLOYER' || role === 'RECRUITER' ? 3 : 2

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const submitData = { ...data, role, ...(role === 'RECRUITER' && { recruiterType }) }
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })
      if (response.ok) {
        toast.success('🎉 Registration successful! Welcome!')
        router.push('/auth/login')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Registration failed')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = async () => {
    let fieldsToValidate = []
    if (currentStep === 1) fieldsToValidate = ['name', 'email']
    else if (currentStep === 2 && role === 'EMPLOYEE') fieldsToValidate = ['phone', 'location']
    else if (currentStep === 2 && role === 'EMPLOYER') fieldsToValidate = ['phone', 'companyName', 'companySize', 'industry']
    else if (currentStep === 2 && role === 'RECRUITER') fieldsToValidate = ['phone', 'department']
    const isValid = await trigger(fieldsToValidate)
    if (isValid && currentStep < totalSteps) setCurrentStep(currentStep + 1)
  }
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="relative max-w-lg w-full space-y-8">
          <StepProgress totalSteps={totalSteps} currentStep={currentStep} />
          <div className="card shadow-2xl border-0 bg-white/90 backdrop-blur-xl">
            {currentStep === 1 && (
              <>
                <RoleSelector role={role} setRole={setRole} />
                <BasicInfoForm
                  register={register}
                  errors={errors}
                  isLoading={isLoading}
                  nextStep={nextStep}
                />
              </>
            )}
            {currentStep === 2 && (
              <ContactDetailsForm
                role={role}
                recruiterType={recruiterType}
                setRecruiterType={setRecruiterType}
                register={register}
                errors={errors}
                isLoading={isLoading}
                nextStep={nextStep}
                prevStep={prevStep}
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
            <FooterLinks />
          </div>
        </div>
      </div>
    </Suspense>
  )
}