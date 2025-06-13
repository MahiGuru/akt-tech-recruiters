import { Phone, MapPin, Building, Briefcase, CheckCircle, Shield, UserCheck, ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const recruiterTypeOptions = [
  { value: 'ADMIN', label: 'Admin Recruiter', description: 'Full access and team management' },
  { value: 'TA', label: 'Technical Analyst', description: 'Technical screening and assessment' },
  { value: 'HR', label: 'Human Resources', description: 'HR processes and compliance' },
  { value: 'CS', label: 'Customer Success', description: 'Client relationship management' },
  { value: 'LEAD', label: 'Lead Recruiter', description: 'Team leadership and strategy' },
  { value: 'JUNIOR', label: 'Junior Recruiter', description: 'Entry-level recruiting role' }
]

export default function ContactDetailsForm({
  role,
  recruiterType,
  setRecruiterType,
  register,
  errors,
  isLoading,
  nextStep,
  prevStep
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-secondary-900">
          {role === 'EMPLOYEE' ? 'Contact Information' : 
           role === 'EMPLOYER' ? 'Company Details' : 
           'Recruiter Details'}
        </h3>
        <p className="text-secondary-600">
          {role === 'EMPLOYEE' ? 'Help us personalize your experience' : 
           role === 'EMPLOYER' ? 'Tell us about your company' : 
           'Set up your recruiter profile'}
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

      {/* Recruiter */}
      {role === 'RECRUITER' && (
        <>
          <div className="form-group">
            <label className="form-label required text-secondary-800">
              Recruiter Type
            </label>
            <div className="grid grid-cols-1 gap-3">
              {recruiterTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRecruiterType(option.value)}
                  className={`p-4 border-2 rounded-lg transition-all duration-200 text-left ${
                    recruiterType === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      option.value === 'ADMIN' ? 'bg-red-100 text-red-600' :
                      option.value === 'TA' ? 'bg-blue-100 text-blue-600' :
                      option.value === 'HR' ? 'bg-green-100 text-green-600' :
                      option.value === 'CS' ? 'bg-purple-100 text-purple-600' :
                      option.value === 'LEAD' ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {option.value === 'ADMIN' ? <Shield className="w-4 h-4" /> :
                        <UserCheck className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-secondary-900">{option.label}</h4>
                      <p className="text-sm text-secondary-600">{option.description}</p>
                    </div>
                    {recruiterType === option.value && (
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
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