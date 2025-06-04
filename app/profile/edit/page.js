'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  Save,
  ArrowLeft,
  Plus,
  X,
  Award
} from 'lucide-react'
import ResumeUpload from '../../components/ResumeUpload';

export default function EditProfile() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }
    
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'EMPLOYEE') {
      router.push('/dashboard/employer')
      return
    }
    
    setUser(parsedUser)
    setSkills(parsedUser.skills || [])
    
    // Pre-fill form
    setValue('name', parsedUser.name)
    setValue('email', parsedUser.email)
    setValue('phone', parsedUser.phone || '')
    setValue('location', parsedUser.location || '')
    setValue('experience', parsedUser.experience || '')
    setValue('bio', parsedUser.bio || '')
  }, [router, setValue])

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const updateData = {
        ...data,
        skills,
        experience: parseInt(data.experience) || 0
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const updatedUser = await response.json()
        localStorage.setItem('user', JSON.stringify(updatedUser))
        toast.success('Profile updated successfully!')
        router.push('/dashboard/employee')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResumeUploadSuccess = (url, filename) => {
    const updatedUser = { ...user, resumeUrl: url }
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="logo w-10 h-10">
                <Briefcase className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-gradient">TalentHub</span>
            </div>
            
            <button 
              onClick={() => router.push('/dashboard/employee')}
              className="btn btn-secondary btn-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
            <p className="text-secondary-600">Keep your profile up to date to attract the best opportunities</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
                <h2 className="text-xl font-bold mb-6">Personal Information</h2>
                
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label required">Full Name</label>
                    <div className="input-with-icon">
                      <input
                        id="name"
                        {...register('name', { required: 'Name is required' })}
                        className={`input-field ${errors.name ? 'error' : ''}`}
                      />
                      <User className="input-icon" />
                    </div>
                    {errors.name && (
                      <div className="form-error">{errors.name.message}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label required">Email</label>
                    <div className="input-with-icon">
                      <input
                        id="email"
                        type="email"
                        {...register('email', { required: 'Email is required' })}
                        className={`input-field ${errors.email ? 'error' : ''}`}
                        disabled
                      />
                      <Mail className="input-icon" />
                    </div>
                    <p className="text-xs text-secondary-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">Phone Number</label>
                    <div className="input-with-icon">
                      <input
                        id="phone"
                        type="tel"
                        {...register('phone')}
                        className="input-field"
                        placeholder="+1 (555) 123-4567"
                      />
                      <Phone className="input-icon" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="location" className="form-label">Location</label>
                    <div className="input-with-icon">
                      <input
                        id="location"
                        {...register('location')}
                        className="input-field"
                        placeholder="New York, NY"
                      />
                      <MapPin className="input-icon" />
                    </div>
                  </div>

                  <div className="form-group md:col-span-2">
                    <label htmlFor="experience" className="form-label">Years of Experience</label>
                    <div className="input-with-icon">
                      <input
                        id="experience"
                        type="number"
                        min="0"
                        max="50"
                        {...register('experience')}
                        className="input-field"
                        placeholder="5"
                      />
                      <Award className="input-icon" />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="form-group">
                  <label htmlFor="bio" className="form-label">Professional Bio</label>
                  <textarea
                    id="bio"
                    {...register('bio')}
                    className="input-field"
                    rows={4}
                    placeholder="Tell employers about yourself, your experience, and what you're looking for..."
                  />
                </div>

                {/* Skills */}
                <div className="form-group">
                  <label className="form-label">Skills</label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        className="input-field flex-1"
                        placeholder="Add a skill (e.g., JavaScript, Project Management)"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="btn btn-primary"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="text-primary-600 hover:text-primary-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/employee')}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="btn btn-primary flex-1"
                  >
                    {isLoading ? (
                      <>
                        <div className="loading-spinner w-4 h-4" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Profile
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Resume Upload */}
            <div className="lg:col-span-1">
              <div className="card">
                <h3 className="text-lg font-bold mb-4">Resume</h3>
                <ResumeUpload
                  currentResumeUrl={user.resumeUrl}
                  userId={user.id}
                  onUploadSuccess={handleResumeUploadSuccess}
                  onUploadError={(error) => console.error('Upload error:', error)}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
