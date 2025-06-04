'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { User, Building, Mail, Lock, Phone, MapPin, Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState(searchParams.get('role') || 'EMPLOYEE')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors }, watch } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, role })
      })

      if (response.ok) {
        toast.success('Registration successful!')
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

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Skip Link */}
      <a href="#registration-form" className="skip-link">
        Skip to registration form
      </a>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-8" aria-label="TalentHub Home">
            <div className="logo w-12 h-12">
              <User className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold text-gradient">TalentHub</span>
          </Link>
          
          <h1 className="text-3xl font-bold mb-3">
            Create your account
          </h1>
          <p className="text-secondary-600">
            Join our community of professionals
          </p>
        </div>

        <div className="card">
          {/* Role Selection */}
          <fieldset className="mb-8">
            <legend className="form-label mb-4">I am a:</legend>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('EMPLOYEE')}
                className={`p-4 border-2 rounded-xl flex flex-col items-center gap-3 transition-all duration-200 ${
                  role === 'EMPLOYEE' 
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md scale-105' 
                    : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50'
                }`}
                aria-pressed={role === 'EMPLOYEE'}
              >
                <User className="w-6 h-6" />
                <span className="font-semibold">Job Seeker</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('EMPLOYER')}
                className={`p-4 border-2 rounded-xl flex flex-col items-center gap-3 transition-all duration-200 ${
                  role === 'EMPLOYER' 
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md scale-105' 
                    : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50'
                }`}
                aria-pressed={role === 'EMPLOYER'}
              >
                <Building className="w-6 h-6" />
                <span className="font-semibold">Employer</span>
              </button>
            </div>
          </fieldset>

          <form id="registration-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Name Field */}
            <div className="form-group">
              <label htmlFor="name" className="form-label required">
                Full Name
              </label>
              <div className="input-with-icon">
                <input
                  id="name"
                  {...register('name', { 
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  className={`input-field ${errors.name ? 'error' : ''}`}
                  placeholder="John Doe"
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                <User className="input-icon" aria-hidden="true" />
              </div>
              {errors.name && (
                <div id="name-error" className="form-error" role="alert">
                  {errors.name.message}
                </div>
              )}
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label required">
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
                  className={`input-field ${errors.email ? 'error' : ''}`}
                  placeholder="john@example.com"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                <Mail className="input-icon" aria-hidden="true" />
              </div>
              {errors.email && (
                <div id="email-error" className="form-error" role="alert">
                  {errors.email.message}
                </div>
              )}
            </div>

            {/* Employee-specific fields */}
            {role === 'EMPLOYEE' && (
              <>
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                  <div className="input-with-icon">
                    <input
                      id="phone"
                      type="tel"
                      {...register('phone')}
                      className="input-field"
                      placeholder="+1 (555) 123-4567"
                    />
                    <Phone className="input-icon" aria-hidden="true" />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="location" className="form-label">
                    Location
                  </label>
                  <div className="input-with-icon">
                    <input
                      id="location"
                      {...register('location')}
                      className="input-field"
                      placeholder="New York, NY"
                    />
                    <MapPin className="input-icon" aria-hidden="true" />
                  </div>
                </div>
              </>
            )}

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label required">
                Password
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
                  className={`input-field ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  aria-describedby={errors.password ? 'password-error' : 'password-help'}
                />
                <Lock className="input-icon" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password ? (
                <div id="password-error" className="form-error" role="alert">
                  {errors.password.message}
                </div>
              ) : (
                <div id="password-help" className="text-xs text-secondary-500 mt-1">
                  Must be at least 6 characters long
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn btn-primary w-full"
              aria-describedby="submit-help"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner" aria-hidden="true" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
            <div id="submit-help" className="sr-only">
              Click to create your TalentHub account
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}