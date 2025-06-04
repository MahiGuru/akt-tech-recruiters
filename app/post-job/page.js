'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { 
  Building, 
  MapPin, 
  DollarSign, 
  FileText, 
  Plus, 
  X,
  Briefcase
} from 'lucide-react'

export default function PostJob() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [requirements, setRequirements] = useState([])
  const [benefits, setBenefits] = useState([])
  const [newRequirement, setNewRequirement] = useState('')
  const [newBenefit, setNewBenefit] = useState('')
  
  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'EMPLOYER') {
      router.push('/dashboard/employee')
      return
    }
    
    setUser(parsedUser)
  }, [router])

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()])
      setNewRequirement('')
    }
  }

  const removeRequirement = (index) => {
    setRequirements(requirements.filter((_, i) => i !== index))
  }

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setBenefits([...benefits, newBenefit.trim()])
      setNewBenefit('')
    }
  }

  const removeBenefit = (index) => {
    setBenefits(benefits.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    try {
      const jobData = {
        ...data,
        requirements,
        benefits,
        employerId: user.id
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      })

      if (response.ok) {
        toast.success('Job posted successfully!')
        router.push('/dashboard/employer')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to post job')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">AKT Talents</span>
            </div>
            
            <button 
              onClick={() => router.push('/dashboard/employer')}
              className="btn-secondary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a New Job</h1>
            <p className="text-gray-600">Fill out the details to attract the best candidates</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  {...register('title', { required: 'Job title is required' })}
                  className="input-field"
                  placeholder="Senior Software Engineer"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('company', { required: 'Company name is required' })}
                    className="input-field pl-10"
                    placeholder="TechCorp Inc."
                  />
                </div>
                {errors.company && (
                  <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('location', { required: 'Location is required' })}
                    className="input-field pl-10"
                    placeholder="New York, NY"
                  />
                </div>
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type *
                </label>
                <select
                  {...register('type', { required: 'Job type is required' })}
                  className="input-field"
                >
                  <option value="">Select job type</option>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="REMOTE">Remote</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('salary', { required: 'Salary range is required' })}
                    className="input-field pl-10"
                    placeholder="$80,000 - $120,000"
                  />
                </div>
                {errors.salary && (
                  <p className="mt-1 text-sm text-red-600">{errors.salary.message}</p>
                )}
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                {...register('description', { required: 'Job description is required' })}
                rows={6}
                className="input-field"
                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    className="input-field flex-1"
                    placeholder="Add a requirement (e.g., 3+ years experience with React)"
                  />
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="btn-primary"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                {requirements.length > 0 && (
                  <div className="space-y-2">
                    {requirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <span className="flex-1 text-gray-700">{req}</span>
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Benefits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benefits & Perks
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                    className="input-field flex-1"
                    placeholder="Add a benefit (e.g., Health insurance, Remote work)"
                  />
                  <button
                    type="button"
                    onClick={addBenefit}
                    className="btn-primary"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                {benefits.length > 0 && (
                  <div className="space-y-2">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <span className="flex-1 text-gray-700">{benefit}</span>
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.push('/dashboard/employer')}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1 justify-center">
                <Briefcase className="w-5 h-5" />
                Post Job
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}