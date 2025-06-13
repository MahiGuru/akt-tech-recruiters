import { User, Building, UserCheck, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const roleOptions = [
  {
    value: 'EMPLOYEE',
    title: 'Job Seeker',
    description: 'Find your dream job',
    icon: User,
    gradient: 'from-blue-500 to-cyan-500',
    benefits: ['Browse thousands of jobs', 'Upload multiple resumes']
  },
  {
    value: 'EMPLOYER',
    title: 'Employer',
    description: 'Hire top talent',
    icon: Building,
    gradient: 'from-purple-500 to-pink-500',
    benefits: ['Post unlimited jobs', 'Access talent pool']
  },
  {
    value: 'RECRUITER',
    title: 'Recruiter',
    description: 'Connect talent with opportunities',
    icon: UserCheck,
    gradient: 'from-green-500 to-teal-500',
    benefits: ['Access all resumes', 'Manage candidates']
  }
]

export default function RoleSelector({ role, setRole }) {
  return (
    <fieldset className="mb-8">
      <div className="grid grid-cols-1 gap-4">
        {roleOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setRole(option.value)}
            className={`relative p-6 border-2 rounded-2xl transition-all duration-300 text-left group ${role === option.value
                ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-purple-50 shadow-lg scale-[1.02]'
                : 'border-secondary-200 hover:border-primary-300 hover:shadow-md hover:scale-[1.01]'
              }`}
            aria-pressed={role === option.value}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${option.gradient} flex items-center justify-center shadow-lg`}>
                <option.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-secondary-900 mb-1">{option.title}</h3>
                <p className="text-secondary-600 text-sm mb-3">{option.description}</p>
                <ul className="space-y-1">
                  {option.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-secondary-600">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              {role === option.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </div>
          </button>
        ))}
      </div>
    </fieldset>
  )
}