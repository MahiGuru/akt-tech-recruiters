'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User, 
  FileText, 
  Briefcase, 
  Upload,
  Edit,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp
} from 'lucide-react'
import MultipleResumeUpload from '../../components/MultipleResumeUpload'
import ResumeUpload from '@/app/(client)/components/ResumeUpload'
import useStore from '../../store/authStore'

export default function EmployeeDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { user: storeUser, updateUser } = useStore()
  const [applications, setApplications] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [showResumeUpload, setShowResumeUpload] = useState(true)
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    viewedApplications: 0
  })

  // Use session user or store user as fallback
  const user = session?.user || storeUser

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    if (session.user.role !== 'EMPLOYEE') {
      router.push('/dashboard/employer')
      return
    }
    
    if (session.user.id) {
      fetchApplications(session.user.id)
      setShowResumeUpload(!session.user.resumeUrl)
    }
  }, [session, status, router])

  const fetchApplications = async (userId) => {
    try {
      const response = await fetch(`/api/applications?employeeId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
        
        // Calculate stats
        setStats({
          totalApplications: data.length,
          pendingApplications: data.filter(app => app.status === 'PENDING').length,
          viewedApplications: data.filter(app => app.status === 'REVIEWED').length
        })
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const handleResumeUploadSuccess = (url, filename) => {
    // Update the session user data
    updateUser({ resumeUrl: url })
    setShowResumeUpload(false)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
      </div>
    )
  }

  if (!session || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}! Heres your job search overview.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Profile</h2>
                <button
                  onClick={() => router.push('/auth/profile/edit')}
                  className="btn btn-ghost btn-sm"
                  aria-label="Edit profile"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
              
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-primary-600" />
                  )}
                </div>
                <h3 className="text-xl font-bold mb-1">{user.name}</h3>
                <p className="text-secondary-600">{user.email}</p>
                {user.location && (
                  <p className="text-sm text-secondary-500 mt-1">{user.location}</p>
                )}
              </div>
              
              <div className="space-y-4">
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-secondary-400" />
                    <span className="text-secondary-700">{user.phone}</span>
                  </div>
                )}
                
                {user.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-secondary-400" />
                    <span className="text-secondary-700">{user.location}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-secondary-400" />
                  <span className="text-secondary-700">{user.email}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-secondary-400" />
                  <span className="text-secondary-700">
                    Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div> 
            
            {/* Quick Stats */}
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Total Applications</span>
                  <span className="font-bold text-primary-600">{stats.totalApplications}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Pending Review</span>
                  <span className="font-bold text-warning-600">{stats.pendingApplications}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary-600">Viewed by Employers</span>
                  <span className="font-bold text-success-600">{stats.viewedApplications}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <button 
                  onClick={() => router.push('/jobs')}
                  className="p-6 border-2 border-dashed border-secondary-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all text-left group"
                >
                  <Briefcase className="w-8 h-8 text-primary-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-secondary-900 mb-2">Browse Jobs</h3>
                  <p className="text-sm text-secondary-600">Find your next opportunity</p>
                </button>
                
                <button 
                  onClick={() => router.push('/auth/profile/edit')}
                  className="p-6 border-2 border-dashed border-secondary-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all text-left group"
                >
                  <User className="w-8 h-8 text-primary-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-secondary-900 mb-2">Update Profile</h3>
                  <p className="text-sm text-secondary-600">Keep your info current</p>
                </button>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Resume</h3>
                {user.resumeUrl && (
                  <button
                    onClick={() => setShowResumeUpload(true)}
                    className="btn btn-ghost btn-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Update
                  </button>
                )}
              </div> 
              {showResumeUpload || !user.resumeUrl ? (
                <>
                <ResumeUpload
                  currentResumeUrl={user.resumeUrl}
                  userId={user.id}
                  onUploadSuccess={handleResumeUploadSuccess}
                  onUploadError={(error) => console.error('Upload error:', error)}
                />
                {/* Main Upload Component */}
                <MultipleResumeUpload
                  userId={user.id}
                  userName={user.name}
                  onUploadSuccess={(resume) => {
                    console.log('Upload success:', resume)
                  }}
                  onUploadError={(error) => {
                    console.error('Upload error:', error)
                  }}
                />
                </>
              ) : (
                <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-success-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-success-900">Resume uploaded</p>
                      <p className="text-sm text-success-600">Ready for applications</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* My Applications */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">My Applications</h2>
                {applications.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-secondary-600">
                    <TrendingUp className="w-4 h-4" />
                    {applications.length} total
                  </div>
                )}
              </div>
              
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-secondary-400" />
                  </div>
                  <h3 className="text-lg font-bold text-secondary-900 mb-2">No applications yet</h3>
                  <p className="text-secondary-600 mb-6">Start applying to jobs to see them here</p>
                  <button 
                    onClick={() => router.push('/jobs')}
                    className="btn btn-primary"
                  >
                    <Briefcase className="w-5 h-5" />
                    Browse Jobs
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application, index) => (
                    <motion.div
                      key={application.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="border border-secondary-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-secondary-900 mb-1">{application.job.title}</h3>
                              <p className="text-secondary-600 font-medium">{application.job.company}</p>
                            </div>
                            <span className={`badge badge-${application.status.toLowerCase()}`}>
                              {application.status}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600 mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {application.job.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Applied {new Date(application.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {application.job.salary && (
                            <p className="text-sm font-medium text-primary-600">
                              {application.job.salary}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Actions */}
            {!user.resumeUrl && (
              <div className="card bg-warning-50 border-warning-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 text-warning-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-warning-900 mb-2">Complete Your Profile</h3>
                    <p className="text-warning-700 mb-4">
                      Upload your resume to get noticed by employers and increase your chances of getting hired.
                    </p>
                    <button
                      onClick={() => setShowResumeUpload(true)}
                      className="btn btn-warning btn-sm"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Resume
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}