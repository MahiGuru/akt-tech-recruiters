// app/(client)/components/IntegratedTeamDashboard.js
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Settings,
  Eye,
  TrendingUp,
  Award,
  Crown,
  Building,
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'

// Import the enhanced components
import HierarchicalTeamManagement from './HierarchicalTeamManagement'
import { OrgChart } from './EnhancedTeamFeatures'

export default function IntegratedTeamDashboard() {
  const [activeView, setActiveView] = useState('hierarchy') // hierarchy, analytics, orgchart, directory
  const [teamHierarchy, setTeamHierarchy] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showMemberModal, setShowMemberModal] = useState(false)

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      setIsLoading(true)
      
      const [hierarchyResponse, profileResponse] = await Promise.all([
        fetch('/api/recruiter/team/hierarchy'),
        fetch('/api/recruiter/profile')
      ])

      if (hierarchyResponse.ok) {
        const hierarchyData = await hierarchyResponse.json()
        setTeamHierarchy(hierarchyData.hierarchy || [])
      }

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setCurrentUser(profileData)
      }

    } catch (error) {
      console.error('Error fetching team data:', error)
      toast.error('Failed to load team data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMemberClick = (member) => {
    setSelectedMember(member)
    setShowMemberModal(true)
  }

  const navigationTabs = [
    {
      id: 'hierarchy',
      label: 'Team Hierarchy',
      icon: Users,
      description: 'Manage team structure and members'
    },
    {
      id: 'orgchart',
      label: 'Organization Chart',
      icon: Building,
      description: 'Visual team organization'
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="loading-spinner w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Team Dashboard</h2>
          <p className="text-gray-600">Fetching your team data...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <div className="rounded-xl p-1 text-white border-1 border-indigo-500/50 border-dotted">
        <div className="flex items-center justify-center">
          <div>
          <h3 className='text-black text-lg text-center'>{currentUser?.isMainAdmin ? '👑 Main Admin View' : '🛡️ Admin View'}</h3> 
          </div>
          <div className="bg-white bg-opacity-20 rounded-xl p-4">
            <Activity className="w-12 h-12 text-white" />
          </div>
        </div>
      </div> */}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl p-2">
        <div className="flex space-x-1 overflow-x-auto justify-center">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeView === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`
                  flex items-center gap-3 px-6 py-4 rounded-lg font-medium transition-all duration-200 whitespace-nowrap relative
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-semibold">{tab.label}</div>
                  <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                    {tab.description}
                  </div>
                </div>
                
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeView === 'hierarchy' && (
            <HierarchicalTeamManagement />
          )}

          {activeView === 'orgchart' && (
            <OrgChart 
              teamHierarchy={teamHierarchy}
              onMemberClick={handleMemberClick}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Member Details Modal */}
      <AnimatePresence>
        {showMemberModal && selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowMemberModal(false)
                setSelectedMember(null)
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Team Member Details</h3>
                <button
                  onClick={() => {
                    setShowMemberModal(false)
                    setSelectedMember(null)
                  }}
                  className="btn btn-ghost btn-sm p-2"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Member Header */}
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                  <div className="relative">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                      selectedMember.isActive ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-300'
                    }`}>
                      {selectedMember.user.image ? (
                        <img 
                          src={selectedMember.user.image} 
                          alt={selectedMember.user.name} 
                          className="w-20 h-20 rounded-full"
                        />
                      ) : (
                        <Users className="w-10 h-10 text-white" />
                      )}
                    </div>
                    {selectedMember.isMainAdmin && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900">{selectedMember.user.name}</h4>
                    <p className="text-gray-600 text-lg">{selectedMember.user.email}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(selectedMember.recruiterType)}`}>
                        {selectedMember.recruiterType}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedMember.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedMember.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {selectedMember.isMainAdmin && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                          Main Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Member Details Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-gray-900">Basic Information</h5>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Role</label>
                        <p className="text-gray-900">{selectedMember.recruiterType}</p>
                      </div>
                      
                      {selectedMember.department && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Department</label>
                          <p className="text-gray-900">{selectedMember.department}</p>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Level in Hierarchy</label>
                        <p className="text-gray-900">Level {selectedMember.level || 0}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Member Since</label>
                        <p className="text-gray-900">
                          {new Date(selectedMember.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-gray-900">Performance Metrics</h5>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{Math.floor(Math.random() * 50) + 10}</div>
                        <div className="text-sm text-gray-600">Candidates</div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{Math.floor(Math.random() * 30) + 70}%</div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{Math.floor(Math.random() * 20) + 5}</div>
                        <div className="text-sm text-gray-600">Applications</div>
                      </div>
                      
                      <div className="bg-orange-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{Math.floor(Math.random() * 15) + 3}</div>
                        <div className="text-sm text-gray-600">Interviews</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Structure (if has subordinates) */}
                {selectedMember.subordinates && selectedMember.subordinates.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-gray-900">
                      Direct Reports ({selectedMember.subordinates.length})
                    </h5>
                    
                    <div className="grid gap-3">
                      {selectedMember.subordinates.map((subordinate) => (
                        <div key={subordinate.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            subordinate.isActive ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-300'
                          }`}>
                            {subordinate.user.image ? (
                              <img 
                                src={subordinate.user.image} 
                                alt={subordinate.user.name} 
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <Users className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{subordinate.user.name}</p>
                            <p className="text-sm text-gray-600">{subordinate.recruiterType}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            subordinate.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {subordinate.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      // Handle contact action
                      window.location.href = `mailto:${selectedMember.user.email}`
                    }}
                    className="btn btn-primary flex-1"
                  >
                    Contact Member
                  </button>
                  
                  <button
                    onClick={() => {
                      setActiveView('orgchart')
                      setShowMemberModal(false)
                      setSelectedMember(null)
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    View Org Chart
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper function to get role colors
function getRoleColor(role) {
  const colors = {
    ADMIN: 'bg-red-100 text-red-800',
    LEAD: 'bg-purple-100 text-purple-800',
    TA: 'bg-blue-100 text-blue-800',
    HR: 'bg-green-100 text-green-800',
    CS: 'bg-indigo-100 text-indigo-800',
    JUNIOR: 'bg-gray-100 text-gray-800'
  }
  return colors[role] || colors.JUNIOR
}