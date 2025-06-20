// app/(client)/dashboard/recruiter/DashboardTabs.js (Responsive Redesign)
import { 
    BarChart3, 
    UserPlus, 
    Upload, 
    Link as LinkIcon, 
    FileText, 
    Users, 
    TrendingUp,
    Shield,
    Clock,
    ChevronDown
  } from "lucide-react"
  import { motion } from "framer-motion"
  import { useState, useEffect } from "react"
  
  export default function DashboardTabs({ activeTab, setActiveTab, isAdmin }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
  
    // Handle window resize
    useEffect(() => {
      const checkScreenSize = () => {
        const mobile = window.innerWidth < 1024 // lg breakpoint
        setIsMobile(mobile)
        
        // Close mobile menu when switching to desktop
        if (!mobile && mobileMenuOpen) {
          setMobileMenuOpen(false)
        }
      }
  
      // Check initial screen size
      checkScreenSize()
  
      // Add resize listener
      window.addEventListener('resize', checkScreenSize)
      
      // Cleanup
      return () => window.removeEventListener('resize', checkScreenSize)
    }, [mobileMenuOpen])
  
    const tabs = [
      {
        id: "dashboard",
        label: isAdmin ? "Admin Dashboard" : "Dashboard",
        shortLabel: isAdmin ? "Admin" : "Dashboard",
        icon: isAdmin ? Shield : BarChart3,
        description: isAdmin ? "Team overview and performance" : "Your recruiting insights",
        badge: null
      },
      ...(isAdmin ? [
        {
          id: "team",
          label: "My Team",
          shortLabel: "Team",
          icon: Users,
          description: "Manage team members",
          badge: null
        },
        // {
        //   id: "analytics",
        //   label: "Analytics",
        //   shortLabel: "Analytics",
        //   icon: TrendingUp,
        //   description: "Performance insights",
        //   badge: "NEW"
        // }
      ] : []),

      {
        id: "candidates",
        label: "Candidates",
        shortLabel: "Candidates",
        icon: UserPlus,
        description: "Manage your candidates",
        badge: null
      },
      {
        id: "time-management",
        label: "Time Management", 
        shortLabel: "Time",
        icon: Clock,
        description: "Track and manage work hours",
        badge: null
      },
      {
        id: "bulk-upload",
        label: "Bulk Upload",
        shortLabel: "Upload",
        icon: Upload,
        description: "Upload multiple resumes",
        badge: null
      },
      {
        id: "resume-mapping",
        label: "Resume Mapping",
        shortLabel: "Mapping",
        icon: LinkIcon,
        description: "Connect resumes to candidates",
        badge: null
      },
      {
        id: "resumes",
        label: "Resumes",
        shortLabel: "Resumes",
        icon: FileText,
        description: "Browse all resumes",
        badge: null
      },
      
    ]
  
    const activeTabData = tabs.find(tab => tab.id === activeTab)
  
    return (
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        {/* Desktop Navigation */}
        {!isMobile ? (
          <div className="max-w-7xl mx-auto">
            <nav className="flex overflow-x-auto scrollbar-hide" aria-label="Tabs">
              <div className="flex space-x-1 px-4 sm:px-6 min-w-full">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        group relative flex items-center gap-2 py-4 px-3 sm:px-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap
                        ${isActive 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      
                      {/* Show full label on larger screens, short label on smaller */}
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.shortLabel}</span>
                      
                      {/* Badge */}
                      {tab.badge && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {tab.badge}
                        </span>
                      )}
                      
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </nav>
          </div>
        ) : (
          /* Mobile Navigation */
          <div className="relative z-30">
            {/* Mobile Tab Selector */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-left bg-white hover:bg-gray-50 transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-haspopup="true"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {activeTabData && (
                  <>
                    <activeTabData.icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">{activeTabData.label}</div>
                      <div className="text-sm text-gray-500 truncate">{activeTabData.description}</div>
                    </div>
                  </>
                )}
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${mobileMenuOpen ? 'rotate-180' : ''}`} 
              />
            </button>
  
            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-40">
                <div className="py-1 max-h-80 overflow-y-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id)
                          setMobileMenuOpen(false)
                        }}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                          ${isActive 
                            ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500' 
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{tab.label}</div>
                          <div className="text-sm text-gray-500 truncate">{tab.description}</div>
                        </div>
                        {tab.badge && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
  
        {/* Tab Content Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {activeTabData && (
                  <>
                    <activeTabData.icon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg font-semibold text-gray-900 truncate">{activeTabData.label}</h1>
                      <p className="text-sm text-gray-600 truncate">{activeTabData.description}</p>
                    </div>
                  </>
                )}
              </div>
              
              {/* Status indicator */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600 hidden sm:inline">Live</span>
              </div>
            </div>
          </div>
        </div>
  
        {/* Simple backdrop for mobile menu */}
        {isMobile && mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-20" 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    )
  }