import { User, Building, UserCheck, CheckCircle, Briefcase, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { use, useEffect } from 'react'

const roleOptions = [
  {
    value: 'EMPLOYEE',
    title: 'Job Seeker',
    shortTitle: 'Job Seeker',
    description: 'Find your perfect career opportunity',
    icon: User,
    gradient: 'from-blue-500 to-cyan-500',
    accentColor: 'blue',
    benefits: [
      'Browse thousands of job opportunities',
      'Upload and manage multiple resumes', 
      'Track your application status',
      'Get discovered by top employers',
      'Receive personalized job recommendations'
    ],
    features: ['Smart Job Matching', 'Application Tracking', 'Profile Visibility']
  },
  {
    value: 'EMPLOYER', 
    title: 'Employer',
    shortTitle: 'Employer',
    description: 'Hire exceptional talent for your team',
    icon: Building,
    gradient: 'from-purple-500 to-pink-500',
    accentColor: 'purple',
    benefits: [
      'Post unlimited job openings',
      'Access our extensive talent pool',
      'Manage applications efficiently', 
      'Build your dream team faster',
      'Get premium hiring analytics'
    ],
    features: ['Candidate Screening', 'Team Management', 'Hiring Analytics']
  },
  {
    value: 'RECRUITER',
    title: 'Recruiter', 
    shortTitle: 'Recruiter',
    description: 'Start your own recruiting business with admin access',
    icon: UserCheck,
    gradient: 'from-green-500 to-teal-500',
    accentColor: 'green',
    benefits: [
      'Full administrator access and permissions',
      'Access comprehensive resume database',
      'Add and manage your recruiting team',
      'Track placement success metrics',
      'Advanced recruiting tools & automation'
    ],
    features: ['Admin Dashboard', 'Team Management', 'Full Database Access']
  }
]

export default function RoleSelector({ role, setRole, nextStep }) {
  let selectedRole =roleOptions.find(option => option.value === role)
  useEffect(() => {
    selectedRole = roleOptions.find(option => option.value === role)
  }, [roleOptions]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mb-4"
    >
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Path</h2>
        <p className="text-gray-600">Select the option that best describes your goal</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex rounded-2xl bg-gray-100 p-1 mb-4">
        {roleOptions.map((option, index) => {
          const Icon = option.icon
          const isSelected = role === option.value
          
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
              className={`flex-1 relative flex items-center justify-center gap-3 px-4 py-4 rounded-xl font-medium transition-all duration-300 ${
                isSelected
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              {/* Background gradient for selected */}
              {isSelected && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute inset-0 bg-gradient-to-r ${option.gradient} opacity-5 rounded-xl`}
                  transition={{ duration: 0.3 }}
                />
              )}
              
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isSelected 
                  ? `bg-gradient-to-r ${option.gradient} shadow-md` 
                  : 'bg-gray-200'
              }`}>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
              </div>
              
              <span className="text-sm font-semibold">{option.shortTitle}</span>
              
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`w-5 h-5 bg-${option.accentColor}-500 rounded-full flex items-center justify-center`}
                >
                  <CheckCircle className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Selected Role Details */}
      <AnimatePresence mode="wait">
        {selectedRole && (
          <motion.div
            key={selectedRole.value}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-gray-200 rounded-2xl p-4 shadow-lg"
          >
            <div className="text-center mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${selectedRole.gradient} flex items-center justify-center shadow-xl mx-auto mb-3`}>
                <selectedRole.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1">{selectedRole.title}</h3>
              <p className="text-sm text-gray-600">{selectedRole.description}</p>
              
              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {selectedRole.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-1 rounded-full text-xs font-medium bg-${selectedRole.accentColor}-100 text-${selectedRole.accentColor}-700`}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Compact Benefits */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
                <Briefcase className={`w-4 h-4 text-${selectedRole.accentColor}-600`} />
                What you get:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedRole.benefits.slice(0, 4).map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className={`w-3 h-3 text-${selectedRole.accentColor}-500 flex-shrink-0 mt-1`} />
                    <span className="text-xs leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Continue Button */}
            <motion.button
              type="button"
              onClick={nextStep}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-3 px-4 bg-gradient-to-r ${selectedRole.gradient} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2`}
            >
              Continue with {selectedRole.title}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Text */}
      <div className="text-center mt-3">
        <p className="text-xs text-gray-500">
          💡 You can change your account type later in your profile settings
        </p>
      </div>
    </motion.div>
  )
}