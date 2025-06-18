'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { 
  Github, 
  Mail, 
  Linkedin, 
  Loader2, 
  Lock, 
  User,
  Eye,
  EyeOff
} from 'lucide-react'
import Image from 'next/image'

export default function Login() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    // Check if user is already authenticated
    const checkSession = async () => {
      const session = await getSession()
      if (session?.user) {
        // Redirect based on role or to role selection if no role
        if (!session.user.role) {
          router.push('/auth/role-selection')
        } else if (session.user.role === 'EMPLOYER') {
          router.push('/dashboard/employer')
        } else {
          router.push('/dashboard/employee')
        }
      }
    }
    checkSession()
  }, [router])

  // Handle traditional email/password login
  const onSubmit = async (data) => {
    setIsLoading(true)
    setLoadingProvider('credentials')
    
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid email or password')
      } else if (result?.url) {
        // Check the session to determine redirect
        const session = await getSession()
        if (session?.user) {
          toast.success('Login successful!')
          
          if (!session.user.role) {
            router.push('/auth/role-selection')
          } else if (session.user.role === 'EMPLOYER') {
            router.push('/dashboard/employer')
          } else {
            router.push('/dashboard/employee')
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
      setLoadingProvider('')
    }
  }

  // Handle social login
  const handleSocialLogin = async (provider) => {
    setIsLoading(true)
    setLoadingProvider(provider)
    
    try {
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: '/dashboard/employee'
      })

      if (result?.error) {
        toast.error('Sign in failed. Please try again.')
      } else if (result?.url) {
        // Check the session to determine redirect
        const session = await getSession()
        if (session?.user) {
          if (!session.user.role) {
            router.push('/auth/role-selection')
          } else if (session.user.role === 'EMPLOYER') {
            router.push('/dashboard/employer')
          } else {
            router.push('/dashboard/employee')
          }
        }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
      setLoadingProvider('')
    }
  }

  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: Mail,
      bgColor: 'bg-red-500 hover:bg-red-600',
      textColor: 'text-white'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      bgColor: 'bg-gray-900 hover:bg-gray-800',
      textColor: 'text-white'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white'
    }
  ]

  return (
    <div className="pt-6 bg-gray-50 flex items-center justify-center py-1 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Logo */}
        <div className="text-center">
          {/* <Image src="/logo.svg" alt="At Bench Logo" width={300} height={120} className="mx-auto" /> */}
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Welcome @Bench
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          


          {/* Email/Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className={`input-field pl-10 ${errors.email ? 'border-red-400 bg-red-50' : ''}`}
                  placeholder="john@example.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field pl-10 pr-12 ${errors.password ? 'border-red-400 bg-red-50' : ''}`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full btn-primary justify-center py-3"
            >
              {loadingProvider === 'credentials' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Social Login Buttons */}

          {/* Divider */}
          <div className="mt-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with social account</span>
              </div>
            </div>
          </div>
          <div className="space-y-3 mt-6"> 

            <div className="flex items-center justify-center">
            {socialProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleSocialLogin(provider.id)}
                  disabled={isLoading}
                  className={`
                    gap-3 px-4 py-3 mx-4 rounded-lg font-medium text-sm
                    transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    ${provider.bgColor} ${provider.textColor}
                  `}
                >
                  {loadingProvider === provider.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <provider.icon className="w-5 h-5" />
                  )}
                  {/* <span>
                    {loadingProvider === provider.id 
                      ? 'Signing in...' 
                      : `Continue with ${provider.name}`
                    }
                  </span> */}
                </button>
            ))}
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-gray-700">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-gray-700">Privacy Policy</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}