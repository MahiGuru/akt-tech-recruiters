import { Lock, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

function getPasswordStrength(password) {
  if (!password) return { strength: 0, label: '', color: '' }
  let strength = 0
  if (password.length >= 6) strength++
  if (password.match(/[a-z]/)) strength++
  if (password.match(/[A-Z]/)) strength++
  if (password.match(/[0-9]/)) strength++
  if (password.match(/[^a-zA-Z0-9]/)) strength++
  const levels = [
    { strength: 0, label: '', color: '' },
    { strength: 1, label: 'Very Weak', color: 'bg-red-500' },
    { strength: 2, label: 'Weak', color: 'bg-orange-500' },
    { strength: 3, label: 'Fair', color: 'bg-yellow-500' },
    { strength: 4, label: 'Good', color: 'bg-blue-500' },
    { strength: 5, label: 'Strong', color: 'bg-green-500' }
  ]
  return levels[strength]
}

export default function PasswordForm({
  register,
  errors,
  isLoading,
  showPassword,
  setShowPassword,
  password
}) {
  const passwordStrength = getPasswordStrength(password)
  return (
    <div className="form-group">
      <label htmlFor="password" className="form-label required text-secondary-800">
        Create Password
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
          className={`input-field pr-12 transition-all duration-200 ${errors.password ? 'border-red-400 bg-red-50' : 'focus:border-primary-400 focus:bg-white'}`}
          placeholder="Create a secure password"
          disabled={isLoading}
        />
        <Lock className="input-icon text-secondary-400" />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="show-password-icon absolute text-secondary-400 hover:text-secondary-600 transition-colors"
          disabled={isLoading}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {password && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 bg-secondary-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
              />
            </div>
            <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
              {passwordStrength.label}
            </span>
          </div>
        </motion.div>
      )}
      {errors.password ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="form-error"
          role="alert"
        >
          {errors.password.message}
        </motion.div>
      ) : (
        <div className="text-xs text-secondary-500 mt-1">
          Use at least 6 characters with a mix of letters and numbers
        </div>
      )}
    </div>
  )
}