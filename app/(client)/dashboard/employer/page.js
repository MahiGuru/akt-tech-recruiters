'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import AutoResumeJobMatcher from '../../components/AutoResumeJobMatcher';
import { 
  Plus, 
  Briefcase, 
  Users, 
  Eye,
  Edit,
  Trash2,
  Building,
  LogOut
} from 'lucide-react'

export default function EmployerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [activeSection, setActiveSection] = useState('job-matcher');

  const user = session?.user

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }
    
    if (session.user.role !== 'EMPLOYER') {
      router.push('/dashboard/employee')
      return
    }
    
    if (session.user.id) {
      fetchJobs(session.user.id)
      fetchApplications(session.user.id)
    }
  }, [session, status, router])

  const fetchJobs = async (userId) => {
    try {
      const response = await fetch(`/api/jobs?employerId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const fetchApplications = async (userId) => {
    try {
      const response = await fetch(`/api/applications?employerId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
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
      {/* Navigation */}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                <p className="text-gray-600">Active Jobs</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                <p className="text-gray-600">Applications</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {applications.filter(app => app.status === 'PENDING').length}
                </p>
                <p className="text-gray-600">Pending Review</p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Section */}
        <div className="card mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">My Job Posts</h2>
            <button 
              onClick={() => router.push('/post-job')}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              Post New Job
            </button>
          </div>
          
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
              <p className="text-gray-600 mb-4">Start by posting your first job</p>
              <button 
                onClick={() => router.push('/post-job')}
                className="btn-primary"
              >
                <Plus className="w-5 h-5" />
                Post Job
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <p className="text-gray-600 mb-2">{job.location} • {job.salary}</p>
                      <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{job.applications?.length || 0} applications</span>
                        <span>•</span>
                        <span className={job.isActive ? 'text-green-600' : 'text-red-600'}>
                          {job.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* Auto Resume Job Matcher Section */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Resume Matching!!</h2> 
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Use our AI-powered resume matcher to find the best candidates for your jobs.
              </p>
              <AutoResumeJobMatcher />
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Applications</h2>
          
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-600">Applications will appear here once candidates apply</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.slice(0, 5).map((application, index) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{application.employee.name}</h4>
                    <p className="text-gray-600">{application.job.title}</p>
                    <p className="text-sm text-gray-500">
                      Applied {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      application.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      application.status === 'REVIEWED' ? 'bg-blue-100 text-blue-800' :
                      application.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {application.status}
                    </span>
                    <button className="btn-secondary">
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}