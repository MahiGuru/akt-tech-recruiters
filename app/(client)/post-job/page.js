'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { 
  Building, 
  MapPin, 
  IndianRupeeIcon, 
  FileText, 
  Plus, 
  X,
  Briefcase,
  Users,
  Clock,
  Star,
  Target
} from 'lucide-react'
import RichTextEditor from '../components/RichTextEditor'

// Multi-select component
const MultiSelect = ({ 
  options, 
  selected = [], 
  onChange, 
  placeholder = "Select options...",
  className = "",
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const toggleOption = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const removeOption = (value) => {
    onChange(selected.filter(item => item !== value))
  }

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`input-field cursor-pointer ${error ? 'border-red-400 bg-red-50' : ''} ${className}`}
      >
        {selected.length === 0 ? (
          <span className="text-secondary-400">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selected.map(value => {
              const option = options.find(opt => opt.value === value)
              return (
                <span 
                  key={value}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm"
                >
                  {option?.label || value}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeOption(value)
                    }}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map(option => (
            <div
              key={option.value}
              onClick={() => toggleOption(option.value)}
              className={`p-3 cursor-pointer hover:bg-secondary-50 flex items-center justify-between ${
                selected.includes(option.value) ? 'bg-primary-50 text-primary-700' : ''
              }`}
            >
              <span>{option.label}</span>
              {selected.includes(option.value) && (
                <Star className="w-4 h-4 text-primary-600 fill-current" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PostJob() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [requirements, setRequirements] = useState([])
  const [benefits, setBenefits] = useState([])
  const [newRequirement, setNewRequirement] = useState('')
  const [newBenefit, setNewBenefit] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [selectedSkills, setSelectedSkills] = useState([])
  const [selectedJobTypes, setSelectedJobTypes] = useState([])
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm()

  // Skills options for multi-select
  const skillsOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'react', label: 'React' },
    { value: 'nodejs', label: 'Node.js' },
    { value: 'java', label: 'Java' },
    { value: 'php', label: 'PHP' },
    { value: 'html', label: 'HTML/CSS' },
    { value: 'sql', label: 'SQL' },
    { value: 'aws', label: 'AWS' },
    { value: 'docker', label: 'Docker' },
    { value: 'mongodb', label: 'MongoDB' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'angular', label: 'Angular' },
    { value: 'vue', label: 'Vue.js' },
    { value: 'figma', label: 'Figma' },
    { value: 'photoshop', label: 'Photoshop' },
    { value: 'marketing', label: 'Digital Marketing' },
    { value: 'seo', label: 'SEO' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'communication', label: 'Communication' }
  ]

  // Job types for multi-select
  const jobTypeOptions = [
    { value: 'FULL_TIME', label: 'Full Time' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'REMOTE', label: 'Remote' },
    { value: 'HYBRID', label: 'Hybrid' },
    { value: 'INTERNSHIP', label: 'Internship' },
    { value: 'FREELANCE', label: 'Freelance' }
  ]

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    // Allow both EMPLOYER and RECRUITER to access
    if (parsedUser.role !== 'EMPLOYER' && parsedUser.role !== 'RECRUITER') {
      router.push('/dashboard/employee') // Redirects non-employers/recruiters
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
        description: jobDescription,
        requirements,
        benefits,
        skills: selectedSkills,
        jobTypes: selectedJobTypes,
        employerId: user.id // Use recruiter's user ID as employerId
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card shadow-2xl bg-white/90 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">Post a New Job</h1>
            <p className="text-secondary-600">Find the perfect candidate for your team</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="title" className="form-label required">
                  Job Title
                </label>
                <input
                  id="title"
                  {...register('title', { required: 'Job title is required' })}
                  className={`input-field ${errors.title ? 'border-red-400 bg-red-50' : ''}`}
                  placeholder="e.g., Senior React Developer"
                />
                {errors.title && (
                  <p className="form-error">{errors.title.message}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="company" className="form-label required">
                  Company Name
                </label>
                <div className="input-with-icon">
                  <input
                    id="company"
                    {...register('company', { required: 'Company name is required' })}
                    className={`input-field ${errors.company ? 'border-red-400 bg-red-50' : ''}`}
                    placeholder="e.g., TechCorp Pvt Ltd"
                  />
                  <Building className="input-icon" />
                </div>
                {errors.company && (
                  <p className="form-error">{errors.company.message}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="location" className="form-label required">
                  Location
                </label>
                <div className="input-with-icon">
                  <input
                    id="location"
                    {...register('location', { required: 'Location is required' })}
                    className={`input-field ${errors.location ? 'border-red-400 bg-red-50' : ''}`}
                    placeholder="e.g., Bangalore, Karnataka"
                  />
                  <MapPin className="input-icon" />
                </div>
                {errors.location && (
                  <p className="form-error">{errors.location.message}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="salary" className="form-label required">
                  Salary Range (₹)
                </label>
                <div className="input-with-icon">
                  <input
                    id="salary"
                    {...register('salary', { required: 'Salary range is required' })}
                    className={`input-field ${errors.salary ? 'border-red-400 bg-red-50' : ''}`}
                    placeholder="e.g., ₹8,00,000 - ₹12,00,000 per annum"
                  />
                  <IndianRupeeIcon className="input-icon" />
                </div>
                {errors.salary && (
                  <p className="form-error">{errors.salary.message}</p>
                )}
              </div>
            </div>

            {/* Job Types Multi-Select */}
            <div className="form-group">
              <label className="form-label required">Job Types</label>
              <MultiSelect
                options={jobTypeOptions}
                selected={selectedJobTypes}
                onChange={setSelectedJobTypes}
                placeholder="Select job types..."
                error={selectedJobTypes.length === 0}
              />
              {selectedJobTypes.length === 0 && (
                <p className="form-error">Please select at least one job type</p>
              )}
            </div>

            {/* Job Description with Rich Text Editor */}
            <div className="form-group">
              <label className="form-label required">
                Job Description
              </label>
              <p className="text-sm text-secondary-600 mb-3">
                Use the toolbar to format your job description with headings, bullet points, and more
              </p>
              <RichTextEditor
                value={jobDescription}
                onChange={setJobDescription}
                direction="ltr"
                placeholder="Describe the role, responsibilities, company culture, and what makes this opportunity exciting..."
                minHeight="300px"
              />
              {!jobDescription.trim() && (
                <p className="form-error">Job description is required</p>
              )}
            </div>

            {/* Required Skills Multi-Select */}
            <div className="form-group">
              <label className="form-label">
                Required Skills
              </label>
              <MultiSelect
                options={skillsOptions}
                selected={selectedSkills}
                onChange={setSelectedSkills}
                placeholder="Select required skills..."
              />
            </div>

            {/* Requirements */}
            <div className="form-group">
              <label className="form-label">Requirements</label>
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
                    className="btn btn-primary"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                {requirements.length > 0 && (
                  <div className="space-y-2">
                    {requirements.map((req, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 p-3 bg-secondary-50 rounded-lg border"
                      >
                        <Target className="w-4 h-4 text-primary-600" />
                        <span className="flex-1 text-secondary-700">{req}</span>
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Benefits */}
            <div className="form-group">
              <label className="form-label">Benefits & Perks</label>
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
                    className="btn btn-primary"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                {benefits.length > 0 && (
                  <div className="space-y-2">
                    {benefits.map((benefit, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <Star className="w-4 h-4 text-green-600" />
                        <span className="flex-1 text-green-700">{benefit}</span>
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
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
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary flex-1"
                disabled={!jobDescription.trim() || selectedJobTypes.length === 0}
              >
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