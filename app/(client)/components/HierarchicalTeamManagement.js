// app/(client)/components/HierarchicalTeamManagement.js
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  Search,
  Filter,
  Shield,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronRight,
  Crown,
  Star,
  Award,
  Target,
  Activity,
  Building,
  Eye,
  EyeOff,
  MoreVertical,
  User as UserIcon
} from 'lucide-react'
import toast from 'react-hot-toast'

const recruiterTypeOptions = [
  { 
    value: 'ADMIN', 
    label: 'Admin Recruiter', 
    description: 'Full access and team management', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Shield,
    permissions: ['All permissions', 'Team management', 'Analytics access'],
    canCreateAdmins: false // Sub-admins cannot create other admins
  },
  { 
    value: 'LEAD', 
    label: 'Lead Recruiter', 
    description: 'Team leadership and strategy', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Star,
    permissions: ['Candidate management', 'Team coordination', 'Reporting']
  },
  { 
    value: 'TA', 
    label: 'Technical Analyst', 
    description: 'Technical screening and assessment', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Target,
    permissions: ['Technical interviews', 'Skill assessment', 'Resume review']
  },
  { 
    value: 'HR', 
    label: 'Human Resources', 
    description: 'HR processes and compliance', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: UserCheck,
    permissions: ['HR compliance', 'Background checks', 'Onboarding']
  },
  { 
    value: 'CS', 
    label: 'Customer Success', 
    description: 'Client relationship management', 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Award,
    permissions: ['Client relations', 'Account management', 'Success metrics']
  },
  { 
    value: 'JUNIOR', 
    label: 'Junior Recruiter', 
    description: 'Entry-level recruiting role', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Users,
    permissions: ['Basic recruiting', 'Candidate sourcing', 'Data entry']
  }
]

// Team member node component for hierarchical display
const TeamMemberNode = ({ member, level = 0, isExpanded, onToggleExpand, isMainAdmin, canManage, onViewDetails, onUpdateStatus }) => {
  const typeConfig = getTypeConfig(member.recruiterType)
  const Icon = typeConfig.icon
  const hasSubordinates = member.subordinates && member.subordinates.length > 0
  
  return (
    <div className="relative">
      {/* Connection lines */}
      {level > 0 && (
        <div className="absolute left-4 top-0 w-px h-6 bg-gray-300"></div>
      )}
      
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 hover:border-blue-300 bg-white ${
          level > 0 ? 'ml-8' : ''
        }`}
        style={{ marginLeft: level * 32 }}
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Expand/Collapse Button */}
          {hasSubordinates && (
            <button
              onClick={() => onToggleExpand(member.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          
          {/* Member Avatar */}
          <div className="relative">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              member.isActive ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-300'
            }`}>
              {member.user.image ? (
                <img 
                  src={member.user.image} 
                  alt={member.user.name} 
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <Icon className="w-6 h-6 text-white" />
              )}
            </div>
            
            {/* Main Admin Crown */}
            {isMainAdmin && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}
            
            {/* Status indicator */}
            {member.isActive && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          
          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 truncate">{member.user.name}</h4>
              {isMainAdmin && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  Main Admin
                </span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 truncate">{member.user.email}</p>
            
            {member.department && (
              <p className="text-xs text-gray-500 mt-1">📍 {member.department}</p>
            )}
            
            {hasSubordinates && (
              <p className="text-xs text-blue-600 mt-1">
                👥 {member.subordinates.length} team member{member.subordinates.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          {/* Performance indicators */}
          <div className="hidden md:flex items-center gap-4 mr-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{Math.floor(Math.random() * 50) + 10}</div>
              <div className="text-xs text-gray-500">Candidates</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{Math.floor(Math.random() * 30) + 70}%</div>
              <div className="text-xs text-gray-500">Success</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {canManage && (
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onViewDetails(member)}
              className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700 p-2"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onUpdateStatus(member.id, !member.isActive)}
              className={`btn btn-ghost btn-sm p-2 ${
                member.isActive 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-green-600 hover:text-green-700'
              }`}
              title={member.isActive ? 'Deactivate' : 'Activate'}
            >
              {member.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </motion.button>
          </div>
        )}
      </motion.div>
      
      {/* Render subordinates */}
      <AnimatePresence>
        {hasSubordinates && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2"
          >
            {member.subordinates.map((subordinate) => (
              <TeamMemberNode
                key={subordinate.id}
                member={subordinate}
                level={level + 1}
                isExpanded={member.expandedSubordinates?.includes(subordinate.id)}
                onToggleExpand={onToggleExpand}
                isMainAdmin={false}
                canManage={canManage}
                onViewDetails={onViewDetails}
                onUpdateStatus={onUpdateStatus}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HierarchicalTeamManagement() {
  const [teamHierarchy, setTeamHierarchy] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [stats, setStats] = useState({})
  
  // Add member form state
  const [addMemberForm, setAddMemberForm] = useState({
    name: '',
    email: '',
    recruiterType: 'TA',
    department: '',
    generatePassword: true,
    customPassword: '',
    welcomeMessage: ''
  })

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      setIsLoading(true)
      
      const [teamResponse, pendingResponse, currentUserResponse] = await Promise.all([
        fetch('/api/recruiter/team/hierarchy'),
        fetch('/api/recruiter/team/pending'),
        fetch('/api/recruiter/profile')
      ])

      if (teamResponse.ok) {
        const teamData = await teamResponse.json()
        setTeamHierarchy(teamData.hierarchy || [])
        setStats(teamData.stats || {})
        
        // Auto-expand first level
        const firstLevelIds = teamData.hierarchy.map(node => node.id)
        setExpandedNodes(new Set(firstLevelIds))
      }

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        setPendingRequests(pendingData.requests || [])
      }
      
      if (currentUserResponse.ok) {
        const userData = await currentUserResponse.json()
        setCurrentUser(userData)
      }

    } catch (error) {
      console.error('Error fetching team data:', error)
      toast.error('Failed to load team data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleExpand = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const handleAddTeamMember = async (e) => {
    e.preventDefault()
    
    try {
      const password = addMemberForm.generatePassword 
        ? generateRandomPassword() 
        : addMemberForm.customPassword

      if (!password) {
        toast.error('Password is required')
        return
      }

      const response = await fetch('/api/recruiter/team/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addMemberForm,
          password,
          // Prevent sub-admins from creating other admins
          recruiterType: currentUser?.isMainAdmin === false && addMemberForm.recruiterType === 'ADMIN' 
            ? 'LEAD' 
            : addMemberForm.recruiterType
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`🎉 ${addMemberForm.name} added successfully!`)
        
        if (addMemberForm.generatePassword) {
          toast.success(`Default password: ${password}`, { duration: 10000 })
        }
        
        setShowAddModal(false)
        resetAddForm()
        fetchTeamData()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add team member')
      }
    } catch (error) {
      console.error('Error adding team member:', error)
      toast.error('Something went wrong')
    }
  }

  const handleUpdateMemberStatus = async (memberId, isActive) => {
    try {
      const response = await fetch('/api/recruiter/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterId: memberId,
          isActive
        })
      })

      if (response.ok) {
        toast.success(`Team member ${isActive ? 'activated' : 'deactivated'} successfully`)
        fetchTeamData()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update team member')
      }
    } catch (error) {
      console.error('Error updating team member:', error)
      toast.error('Something went wrong')
    }
  }

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const resetAddForm = () => {
    setAddMemberForm({
      name: '',
      email: '',
      recruiterType: 'TA',
      department: '',
      generatePassword: true,
      customPassword: '',
      welcomeMessage: ''
    })
  }

  const getTypeConfig = (type) => {
    return recruiterTypeOptions.find(option => option.value === type) || recruiterTypeOptions[2]
  }

  // Filter team hierarchy based on search and filters
  const filteredHierarchy = useMemo(() => {
    if (!searchTerm && !statusFilter && !typeFilter) {
      return teamHierarchy
    }

    const filterNode = (node) => {
      const matchesSearch = !searchTerm || 
        node.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.department?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = !statusFilter || 
        (statusFilter === 'active' && node.isActive) ||
        (statusFilter === 'inactive' && !node.isActive)
      
      const matchesType = !typeFilter || node.recruiterType === typeFilter

      const nodeMatches = matchesSearch && matchesStatus && matchesType
      
      // Filter subordinates recursively
      const filteredSubordinates = node.subordinates ? 
        node.subordinates.map(filterNode).filter(Boolean) : []

      // Include node if it matches or has matching subordinates
      if (nodeMatches || filteredSubordinates.length > 0) {
        return {
          ...node,
          subordinates: filteredSubordinates
        }
      }
      
      return null
    }

    return teamHierarchy.map(filterNode).filter(Boolean)
  }, [teamHierarchy, searchTerm, statusFilter, typeFilter])

  const canCreateAdmins = currentUser?.isMainAdmin === true

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="loading-spinner w-8 h-8 text-primary-600 mb-4" />
          <p className="text-gray-600">Loading team hierarchy...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Team Hierarchy</h2>
          <p className="text-gray-600">Manage your recruiting team structure</p>
          {currentUser?.isMainAdmin && (
            <p className="text-sm text-yellow-700 mt-1">
              👑 You are the Main Admin - you can create and manage all team members
            </p>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary px-6 py-3 text-lg font-semibold shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Team Member
        </motion.button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Members</p>
              <p className="text-3xl font-bold mt-1">{stats.total || 0}</p>
              <p className="text-blue-100 text-sm mt-1">{stats.levels || 0} levels</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-lg p-3">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active</p>
              <p className="text-3xl font-bold mt-1">{stats.active || 0}</p>
              <p className="text-green-100 text-sm mt-1">Team members</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-lg p-3">
              <UserCheck className="w-8 h-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Admins</p>
              <p className="text-3xl font-bold mt-1">{stats.admins || 0}</p>
              <p className="text-yellow-100 text-sm mt-1">Including main</p>
            </div>
            <div className="bg-yellow-400 bg-opacity-30 rounded-lg p-3">
              <Crown className="w-8 h-8" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold mt-1">{pendingRequests.length}</p>
              <p className="text-purple-100 text-sm mt-1">Requests</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-lg p-3">
              <Clock className="w-8 h-8" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12 pr-4 py-3 text-lg"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-3"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field py-3"
          >
            <option value="">All Roles</option>
            {recruiterTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setExpandedNodes(new Set(teamHierarchy.map(node => node.id)))}
            className="btn btn-secondary px-4 py-3"
          >
            Expand All
          </button>
          
          <button
            onClick={() => setExpandedNodes(new Set())}
            className="btn btn-secondary px-4 py-3"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Team Hierarchy Display */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <h3 className="text-xl font-semibold text-gray-900">
            Team Structure ({filteredHierarchy.length} top-level member{filteredHierarchy.length !== 1 ? 's' : ''})
          </h3>
        </div>
        
        <div className="p-6">
          {filteredHierarchy.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No team members found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter || typeFilter 
                  ? 'Try adjusting your search criteria' 
                  : 'Start by adding your first team member'
                }
              </p>
              {!searchTerm && !statusFilter && !typeFilter && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  Add First Team Member
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHierarchy.map((node) => (
                <TeamMemberNode
                  key={node.id}
                  member={node}
                  level={0}
                  isExpanded={expandedNodes.has(node.id)}
                  onToggleExpand={handleToggleExpand}
                  isMainAdmin={node.isMainAdmin}
                  canManage={true}
                  onViewDetails={(member) => {
                    setSelectedMember(member)
                    setShowViewModal(true)
                  }}
                  onUpdateStatus={handleUpdateMemberStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal - Enhanced with admin restrictions */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddModal(false)
                resetAddForm()
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
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Add Team Member</h3>
                  <p className="text-gray-600 mt-1">Invite a new recruiter to your team</p>
                  {!canCreateAdmins && (
                    <p className="text-sm text-amber-700 mt-2 bg-amber-50 p-3 rounded-lg">
                      ⚠️ As a sub-admin, you cannot create other admin roles. Only the main admin can create admins.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    resetAddForm()
                  }}
                  className="btn btn-ghost btn-sm p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTeamMember} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label required">Full Name</label>
                    <input
                      type="text"
                      value={addMemberForm.name}
                      onChange={(e) => setAddMemberForm(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field py-3"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Email Address</label>
                    <input
                      type="email"
                      value={addMemberForm.email}
                      onChange={(e) => setAddMemberForm(prev => ({ ...prev, email: e.target.value }))}
                      className="input-field py-3"
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    value={addMemberForm.department}
                    onChange={(e) => setAddMemberForm(prev => ({ ...prev, department: e.target.value }))}
                    className="input-field py-3"
                    placeholder="e.g., Engineering, Sales, Marketing"
                  />
                </div>

                {/* Role Selection with Admin Restriction */}
                <div className="form-group">
                  <label className="form-label required">Role</label>
                  <div className="grid gap-3">
                    {recruiterTypeOptions.map((option) => {
                      const Icon = option.icon
                      const isDisabled = option.value === 'ADMIN' && !canCreateAdmins
                      
                      return (
                        <label
                          key={option.value}
                          className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            isDisabled 
                              ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                              : addMemberForm.recruiterType === option.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="radio"
                            value={option.value}
                            checked={addMemberForm.recruiterType === option.value}
                            onChange={(e) => setAddMemberForm(prev => ({ ...prev, recruiterType: e.target.value }))}
                            className="sr-only"
                            disabled={isDisabled}
                          />
                          <div className="flex items-center gap-4 w-full">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${option.color}`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">{option.label}</h5>
                              <p className="text-gray-600 text-sm">{option.description}</p>
                              {isDisabled && (
                                <p className="text-red-600 text-xs mt-1">
                                  Only main admin can create admin roles
                                </p>
                              )}
                            </div>
                            {addMemberForm.recruiterType === option.value && !isDisabled && (
                              <CheckCircle className="w-6 h-6 text-blue-600" />
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary px-8 py-3"
                    disabled={!addMemberForm.name || !addMemberForm.email}
                  >
                    <Plus className="w-5 h-5" />
                    Add Team Member
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function getTypeConfig(type) {
  return recruiterTypeOptions.find(option => option.value === type) || recruiterTypeOptions[2]
}