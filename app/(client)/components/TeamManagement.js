'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Shield,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Edit,
  Trash2,
  Send,
  Eye,
  EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'

const recruiterTypeOptions = [
  { value: 'ADMIN', label: 'Admin Recruiter', description: 'Full access and team management', color: 'bg-red-100 text-red-800' },
  { value: 'TA', label: 'Technical Analyst', description: 'Technical screening and assessment', color: 'bg-blue-100 text-blue-800' },
  { value: 'HR', label: 'Human Resources', description: 'HR processes and compliance', color: 'bg-green-100 text-green-800' },
  { value: 'CS', label: 'Customer Success', description: 'Client relationship management', color: 'bg-purple-100 text-purple-800' },
  { value: 'LEAD', label: 'Lead Recruiter', description: 'Team leadership and strategy', color: 'bg-orange-100 text-orange-800' },
  { value: 'JUNIOR', label: 'Junior Recruiter', description: 'Entry-level recruiting role', color: 'bg-gray-100 text-gray-800' }
]

export default function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [stats, setStats] = useState({})

  // Add team member form state
  const [addMemberForm, setAddMemberForm] = useState({
    name: '',
    email: '',
    recruiterType: 'TA',
    department: '',
    generatePassword: true,
    customPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch team members
      const teamResponse = await fetch('/api/recruiter/team')
      if (teamResponse.ok) {
        const teamData = await teamResponse.json()
        setTeamMembers(teamData.teamMembers || [])
        setStats(teamData.stats || {})
      }

      // Fetch pending approval requests
      const pendingResponse = await fetch('/api/recruiter/team/pending')
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json()
        setPendingRequests(pendingData.requests || [])
      }

    } catch (error) {
      console.error('Error fetching team data:', error)
      toast.error('Failed to load team data')
    } finally {
      setIsLoading(false)
    }
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
          password
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Team member added successfully! Default password: ${password}`)
        setShowAddModal(false)
        setAddMemberForm({
          name: '',
          email: '',
          recruiterType: 'TA',
          department: '',
          generatePassword: true,
          customPassword: ''
        })
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

  const handleApprovalAction = async (requestId, action) => {
    try {
      const response = await fetch('/api/recruiter/team/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action // 'approve' or 'reject'
        })
      })

      if (response.ok) {
        toast.success(`Request ${action}d successfully`)
        fetchTeamData()
      } else {
        const error = await response.json()
        toast.error(error.message || `Failed to ${action} request`)
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      toast.error('Something went wrong')
    }
  }

  const handleUpdateMember = async (memberId, updates) => {
    try {
      const response = await fetch('/api/recruiter/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterId: memberId,
          ...updates
        })
      })

      if (response.ok) {
        toast.success('Team member updated successfully')
        fetchTeamData()
        setSelectedMember(null)
        setShowViewModal(false)
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

  const getTypeConfig = (type) => {
    return recruiterTypeOptions.find(option => option.value === type) || recruiterTypeOptions[1]
  }

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = 
      member.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && member.isActive) ||
      (statusFilter === 'inactive' && !member.isActive)
    
    const matchesType = !typeFilter || member.recruiterType === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-600 mt-1">Manage your recruiting team members and approvals</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Team Member
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active || 0}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.typeDistribution?.find(t => t.type === 'ADMIN')?.count || 0}
              </p>
              <p className="text-sm text-gray-600">Admins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approval Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Pending Approval Requests ({pendingRequests.length})
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {pendingRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{request.user?.name}</h4>
                    <p className="text-sm text-gray-600">{request.user?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeConfig(request.recruiterType).color}`}>
                        {getTypeConfig(request.recruiterType).label}
                      </span>
                      {request.department && (
                        <span className="text-xs text-gray-500">• {request.department}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprovalAction(request.id, 'approve')}
                    className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleApprovalAction(request.id, 'reject')}
                    className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Types</option>
            {recruiterTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Team Members ({filteredMembers.length})
          </h3>
        </div>
        
        <div className="p-6">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter || typeFilter 
                  ? 'Try adjusting your search criteria' 
                  : 'Start by adding your first team member'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      member.isActive ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {member.user.image ? (
                        <img 
                          src={member.user.image} 
                          alt={member.user.name} 
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <UserCheck className={`w-6 h-6 ${
                          member.isActive ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">{member.user.name}</h4>
                      <p className="text-sm text-gray-600">{member.user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeConfig(member.recruiterType).color}`}>
                          {getTypeConfig(member.recruiterType).label}
                        </span>
                        {member.department && (
                          <span className="text-xs text-gray-500">• {member.department}</span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedMember(member)
                        setShowViewModal(true)
                      }}
                      className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateMember(member.id, { isActive: !member.isActive })}
                      className={`btn btn-ghost btn-sm ${
                        member.isActive 
                          ? 'text-red-600 hover:text-red-700' 
                          : 'text-green-600 hover:text-green-700'
                      }`}
                      title={member.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {member.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Team Member Modal */}
      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false)
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Add Team Member</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-ghost btn-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTeamMember} className="space-y-4">
              <div className="form-group">
                <label className="form-label required">Full Name</label>
                <input
                  type="text"
                  value={addMemberForm.name}
                  onChange={(e) => setAddMemberForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Email</label>
                <input
                  type="email"
                  value={addMemberForm.email}
                  onChange={(e) => setAddMemberForm(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Recruiter Type</label>
                <select
                  value={addMemberForm.recruiterType}
                  onChange={(e) => setAddMemberForm(prev => ({ ...prev, recruiterType: e.target.value }))}
                  className="input-field"
                  required
                >
                  {recruiterTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  value={addMemberForm.department}
                  onChange={(e) => setAddMemberForm(prev => ({ ...prev, department: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Engineering, Sales"
                />
              </div>

              <div className="form-group">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="generatePassword"
                    checked={addMemberForm.generatePassword}
                    onChange={(e) => setAddMemberForm(prev => ({ 
                      ...prev, 
                      generatePassword: e.target.checked,
                      customPassword: e.target.checked ? '' : prev.customPassword
                    }))}
                  />
                  <label htmlFor="generatePassword" className="text-sm font-medium">
                    Generate random password
                  </label>
                </div>

                {!addMemberForm.generatePassword && (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={addMemberForm.customPassword}
                      onChange={(e) => setAddMemberForm(prev => ({ ...prev, customPassword: e.target.value }))}
                      className="input-field pr-12"
                      placeholder="Enter custom password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* View Member Modal */}
      {showViewModal && selectedMember && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowViewModal(false)
              setSelectedMember(null)
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Team Member Details</h3>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedMember(null)
                }}
                className="btn btn-ghost btn-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  {selectedMember.user.image ? (
                    <img 
                      src={selectedMember.user.image} 
                      alt={selectedMember.user.name} 
                      className="w-20 h-20 rounded-full"
                    />
                  ) : (
                    <UserCheck className="w-10 h-10 text-blue-600" />
                  )}
                </div>
                <h4 className="text-lg font-semibold">{selectedMember.user.name}</h4>
                <p className="text-gray-600">{selectedMember.user.email}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <p className="text-sm text-gray-900">
                    {getTypeConfig(selectedMember.recruiterType).label}
                  </p>
                </div>

                {selectedMember.department && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Department</label>
                    <p className="text-sm text-gray-900">{selectedMember.department}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className={`text-sm font-medium ${
                    selectedMember.isActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedMember.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Joined</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedMember.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => handleUpdateMember(selectedMember.id, { 
                  isActive: !selectedMember.isActive 
                })}
                className={`btn flex-1 ${
                  selectedMember.isActive 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {selectedMember.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}