// app/(client)/auth/register/ContactDetailsForm.jsx (Updated version)
import { Phone, MapPin, Building, Briefcase, CheckCircle, Shield, UserCheck, ArrowLeft, ArrowRight, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const recruiterTypeOptions = [
  { value: 'ADMIN', label: 'Admin Recruiter', description: 'Full access and team management', icon: Shield },
  { value: 'TA', label: 'Technical Analyst', description: 'Technical screening and assessment', icon: UserCheck },
  { value: 'HR', label: 'Human Resources', description: 'HR processes and compliance', icon: UserCheck },
  { value: 'CS', label: 'Customer Success', description: 'Client relationship management', icon: UserCheck },
  { value: 'LEAD', label: 'Lead Recruiter', description: 'Team leadership and strategy', icon: UserCheck },
  { value: 'JUNIOR', label: 'Junior Recruiter', description: 'Entry-level recruiting role', icon: UserCheck }
]

export default function ContactDetailsForm({
  role,
  recruiterType,
  setRecruiterType,
  selectedAdmin,
  setSelectedAdmin,
  register,
  errors,
  isLoading,
  nextStep,
  prevStep
}) {
  const [availableAdmins, setAvailableAdmins] = useState([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)

  // Fetch available admins when recruiter role is selected
  useEffect(() => {
    if (role === 'RECRUITER') {
      fetchAvailableAdmins()
    }
  }, [role])

  const fetchAvailableAdmins = async () => {
    try {
      setLoadingAdmins(true)
      const response = await fetch('/api/recruiter/team/request')
      if (response.ok) {
        const data = await response.json()
        setAvailableAdmins(data.admins || [])
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setLoadingAdmins(false)
    }
  }
  const shouldRecommendAdmin = availableAdmins.length === 0
  // Auto-select admin role if no admins are available
  useEffect(() => {
    // if (role === 'RECRUITER' && !loadingAdmins && availableAdmins.length === 0 && recruiterType !== 'ADMIN') {
    //   setRecruiterType('ADMIN')
    // }
  }, [availableAdmins, loadingAdmins, role, recruiterType, setRecruiterType])

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-secondary-900">
          {role === 'EMPLOYEE' ? 'Contact Information' : 
           role === 'EMPLOYER' ? 'Company Details' : 
           'Recruiter Setup'}
        </h3>
        <p className="text-secondary-600">
          {role === 'EMPLOYEE' ? 'Help us personalize your experience' : 
           role === 'EMPLOYER' ? 'Tell us about your company' : 
           'Configure your recruiter profile and team structure'}
        </p>
      </div>

      {/* Phone Number */}
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
            disabled={isLoading}
          />
          <Phone className="input-icon text-secondary-400" />
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

      {/* Employee */}
      {role === 'EMPLOYEE' && (
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
              disabled={isLoading}
            />
            <MapPin className="input-icon text-secondary-400" />
          </div>
        </div>
      )}

      {/* Employer */}
      {role === 'EMPLOYER' && (
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
                disabled={isLoading}
              />
              <Building className="input-icon text-secondary-400" />
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
          <div className="form-group">
            <label htmlFor="companySize" className="form-label required text-secondary-800">
              Company Size
            </label>
            <select
              id="companySize"
              {...register('companySize', { required: 'Company size is required' })}
              className={`input-field transition-all duration-200 ${errors.companySize ? 'border-red-400 bg-red-50' : 'focus:border-primary-400 focus:bg-white'}`}
              disabled={isLoading}
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
              disabled={isLoading}
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
        </>
      )}

      {/* Recruiter - Enhanced with Admin Selection */}
      {role === 'RECRUITER' && (
        <>
          {/* Recruiter Type Selection */}
          <div className="form-group">
            <label className="form-label required text-secondary-800">
              Recruiter Role
            </label>
            <div className="grid grid-cols-1 gap-3">
              {recruiterTypeOptions.map((option) => {
                const Icon = option.icon
                const isAdminOption = option.value === 'ADMIN'
                const isNoAdminsAvailable = availableAdmins.length === 0 && !loadingAdmins
                const isDisabled = isAdminOption && availableAdmins.length > 0 && selectedAdmin
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setRecruiterType(option.value)
                      if (option.value === 'ADMIN') {
                        setSelectedAdmin('') // Clear admin selection if becoming admin
                      }
                    }}
                    disabled={isDisabled}
                    className={`p-4 border-2 rounded-lg transition-all duration-200 text-left ${
                      recruiterType === option.value
                        ? 'border-primary-500 bg-primary-50'
                        : isDisabled 
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-secondary-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        option.value === 'ADMIN' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-secondary-900 flex items-center gap-2">
                          {option.label}
                          {isAdminOption && isNoAdminsAvailable && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Recommended
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-secondary-600">{option.description}</p>
                        {isAdminOption && isNoAdminsAvailable && (
                          <p className="text-xs text-green-600 mt-1">
                            No existing admins found - you'll be the first admin
                          </p>
                        )}
                      </div>
                      {recruiterType === option.value && (
                        <CheckCircle className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Admin Selection - Only show if not becoming admin */}
          {recruiterType !== 'ADMIN' && (
            <div className="form-group">
              <label className="form-label text-secondary-800">
                Choose Your Admin {availableAdmins.length === 0 ? '(Optional)' : '(Required)'}
              </label>
              <p className="text-sm text-gray-600 mb-3">
                {availableAdmins.length === 0 
                  ? 'No admins found. Leave blank to become an admin yourself, or select an existing admin if available.'
                  : 'Select the admin who will manage your access and approve your account.'
                }
              </p>
              
              {loadingAdmins ? (
                <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
                  <div className="loading-spinner w-6 h-6 text-primary-600" />
                  <span className="ml-2 text-gray-600">Loading admins...</span>
                </div>
              ) : availableAdmins.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">No Existing Admins</span>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    Since no admins exist yet, you can either become the first admin or wait for an admin to be created.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Option to become admin instead */}
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value=""
                      checked={selectedAdmin === ''}
                      onChange={(e) => setSelectedAdmin(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Become an Admin</p>
                        <p className="text-sm text-gray-600">No approval needed - immediate access</p>
                      </div>
                    </div>
                  </label>

                  {/* Existing admins */}
                  {availableAdmins.map((admin) => (
                    <label
                      key={admin.id}
                      className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        value={admin.userId}
                        checked={selectedAdmin === admin.userId}
                        onChange={(e) => setSelectedAdmin(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {admin.user.image ? (
                            <img 
                              src={admin.user.image} 
                              alt={admin.user.name} 
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <Users className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{admin.user.name}</p>
                          <p className="text-sm text-gray-600">{admin.user.email}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Department */}
          <div className="form-group">
            <label htmlFor="department" className="form-label text-secondary-800">
              Department
            </label>
            <div className="input-with-icon">
              <input
                id="department"
                {...register('department')}
                className="input-field focus:border-primary-400 focus:bg-white transition-all duration-200"
                placeholder="e.g., Engineering, Sales, Marketing"
                disabled={isLoading}
              />
              <Briefcase className="input-icon text-secondary-400" />
            </div>
          </div>

          {/* Registration Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Registration Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Role:</strong> {recruiterTypeOptions.find(r => r.value === recruiterType)?.label}</p>
              {recruiterType === 'ADMIN' ? (
                <p><strong>Access:</strong> <span className="text-green-600">Immediate (No approval needed)</span></p>
              ) : selectedAdmin === '' ? (
                <p><strong>Access:</strong> <span className="text-green-600">Will become Admin (No approval needed)</span></p>
              ) : (
                <p><strong>Access:</strong> <span className="text-yellow-600">Requires admin approval</span></p>
              )}
            </div>
          </div>
        </>
      )}

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
      </div>
    </div>
  )
}