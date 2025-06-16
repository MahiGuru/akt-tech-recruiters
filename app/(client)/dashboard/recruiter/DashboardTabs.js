// app/(client)/dashboard/recruiter/DashboardTabs.js (Enhanced Version)
import { 
    BarChart3, 
    UserPlus, 
    Upload, 
    Link as LinkIcon, 
    FileText, 
    Users, 
    TrendingUp,
    Shield,
    Activity,
    Target,
    Calendar
  } from "lucide-react"
  import { motion } from "framer-motion"
  
  export default function DashboardTabs({ activeTab, setActiveTab, isAdmin }) {
    const tabs = [
      {
        id: "dashboard",
        label: isAdmin ? "Admin Dashboard" : "Dashboard",
        icon: isAdmin ? Shield : BarChart3,
        description: isAdmin ? "Team overview and performance" : "Your recruiting insights",
        color: "from-blue-500 to-blue-600",
        lightColor: "bg-blue-50 text-blue-600 border-blue-200"
      },
      {
        id: "candidates",
        label: "Manage Candidates",
        icon: UserPlus,
        description: "Add and track candidates",
        color: "from-green-500 to-green-600",
        lightColor: "bg-green-50 text-green-600 border-green-200"
      },
      {
        id: "bulk-upload",
        label: "Bulk Upload",
        icon: Upload,
        description: "Mass resume uploads",
        color: "from-purple-500 to-purple-600",
        lightColor: "bg-purple-50 text-purple-600 border-purple-200"
      },
      {
        id: "resume-mapping",
        label: "Resume Mapping",
        icon: LinkIcon,
        description: "Connect resumes to candidates",
        color: "from-orange-500 to-orange-600",
        lightColor: "bg-orange-50 text-orange-600 border-orange-200"
      },
      {
        id: "resumes",
        label: "All Resumes",
        icon: FileText,
        description: "Resume database",
        color: "from-cyan-500 to-cyan-600",
        lightColor: "bg-cyan-50 text-cyan-600 border-cyan-200"
      },
      ...(isAdmin ? [
        {
          id: "team",
          label: "Team Management",
          icon: Users,
          description: "Manage your recruiting team",
          color: "from-red-500 to-red-600",
          lightColor: "bg-red-50 text-red-600 border-red-200"
        },
        {
          id: "analytics",
          label: "Analytics",
          icon: TrendingUp,
          description: "Deep insights and reports",
          color: "from-indigo-500 to-indigo-600",
          lightColor: "bg-indigo-50 text-indigo-600 border-indigo-200"
        }
      ] : [])
    ]
  
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recruiting Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">
                {isAdmin ? "Manage your team and candidates" : "Track your recruiting progress"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600">Live</span>
            </div>
          </div>
        </div>
  
        {/* Tab Navigation */}
        <div className="relative">
          {/* Desktop Tab Navigation */}
          <div className="hidden lg:block">
            <nav className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab, index) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex-1 min-w-0 px-6 py-6 text-left transition-all duration-200
                      hover:bg-gray-50 focus:outline-none focus:bg-gray-50
                      ${isActive ? 'bg-white' : ''}
                    `}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                    initial={false}
                    animate={{
                      backgroundColor: isActive ? '#ffffff' : '#transparent'
                    }}
                  >
                    {/* Active Tab Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-full"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    
                    <div className="flex items-start gap-4">
                      {/* Icon with gradient background */}
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200
                        ${isActive 
                          ? `bg-gradient-to-br ${tab.color} text-white shadow-lg` 
                          : `${tab.lightColor} border`
                        }
                      `}>
                        <Icon className={`w-6 h-6 ${isActive ? 'text-white' : ''}`} />
                      </div>
                      
                      {/* Tab Content */}
                      <div className="flex-1 min-w-0">
                        <div className={`
                          font-medium transition-colors duration-200
                          ${isActive ? 'text-gray-900' : 'text-gray-600'}
                        `}>
                          {tab.label}
                        </div>
                        <div className={`
                          text-sm mt-1 transition-colors duration-200
                          ${isActive ? 'text-gray-600' : 'text-gray-500'}
                        `}>
                          {tab.description}
                        </div>
                        
                        {/* Progress indicator for active tab */}
                        {isActive && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "60%" }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2"
                          />
                        )}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </nav>
          </div>
  
          {/* Mobile Tab Navigation */}
          <div className="lg:hidden">
            <div className="relative">
              {/* Mobile Tab Selector */}
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full px-4 py-3 text-base font-medium bg-white border-0 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-none appearance-none"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
              
              {/* Dropdown Arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
  
            {/* Mobile Active Tab Display */}
            {tabs.map((tab) => {
              if (tab.id !== activeTab) return null
              const Icon = tab.icon
              
              return (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-4 bg-gray-50 border-t border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      bg-gradient-to-br ${tab.color} text-white shadow-md
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{tab.label}</div>
                      <div className="text-sm text-gray-600">{tab.description}</div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
  
        {/* Tab Content Area Indicator */}
        <div className="px-6 py-2 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {tabs.map((tab) => {
                if (tab.id !== activeTab) return null
                const Icon = tab.icon
                
                return (
                  <motion.div
                    key={tab.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${tab.color} flex items-center justify-center`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Currently viewing: {tab.label}
                    </span>
                  </motion.div>
                )
              })}
            </div>
            
            <div className="flex items-center gap-1">
              {tabs.map((tab, index) => (
                <motion.div
                  key={tab.id}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    activeTab === tab.id ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }