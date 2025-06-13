import { User, Mail, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function BasicInfoForm({ register, errors, isLoading, nextStep }) {
  return (
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
            disabled={isLoading}
          />
          <User className="input-icon text-secondary-400" />
        </div>
        {errors.name && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
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
            disabled={isLoading}
          />
          <Mail className="input-icon text-secondary-400" />
        </div>
        {errors.email && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
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
  )
}