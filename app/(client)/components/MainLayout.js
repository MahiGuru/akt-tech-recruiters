'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Briefcase, 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Bell,
  Building,
  UserCheck,
  Search,
  Plus,
  Star
} from 'lucide-react'
import Image from 'next/image'

import NotificationService from './NotificationService'
import RecruiterAccessGuard from './RecruiterAccessGuard'


export default function MainLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleDashboardRedirect = () => {
    if (session?.user?.role === 'EMPLOYER') {
      router.push('/dashboard/employer')
    } else if (session?.user?.role === 'RECRUITER') {
      router.push('/dashboard/recruiter')
    } else {
      router.push('/dashboard/employee')
    }
    setShowUserMenu(false)
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
    setShowUserMenu(false)
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'EMPLOYER':
        return 'bg-purple-100 text-purple-800'
      case 'RECRUITER':
        return 'bg-green-100 text-green-800'
      case 'EMPLOYEE':
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'EMPLOYER':
        return 'Employer'
      case 'RECRUITER':
        return 'Recruiter'
      case 'EMPLOYEE':
      default:
        return 'Job Seeker'
    }
  }

  return (
    <RecruiterAccessGuard>
      <div className="min-h-screen flex flex-col">
        {/* Notification Service */}
        <NotificationService />
        
        {/* Navigation */}
        <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logo.svg" alt="At Bench Logo" width={200} height={80} />
              </Link>
              
              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-8">
                <Link 
                  href="/jobs" 
                  className={`text-gray-600 hover:text-gray-900 transition-colors font-medium ${
                    pathname === '/jobs' ? 'text-primary-600 border-b-2 border-primary-600 pb-1' : ''
                  }`}
                >
                  Jobs
                </Link>
                <Link 
                  href="/contact" 
                  className={`text-gray-600 hover:text-gray-900 transition-colors font-medium ${
                    pathname === '/contact' ? 'text-primary-600 border-b-2 border-primary-600 pb-1' : ''
                  }`}>Contact</Link>
                
                {(session?.user?.role === 'EMPLOYER' || 
                  (session?.user?.role === 'RECRUITER' && session?.user?.recruiterProfile?.isActive)) && (
                  <Link 
                    href="/post-job" 
                    className={`text-gray-600 hover:text-gray-900 transition-colors font-medium ${
                      pathname === '/post-job' ? 'text-primary-600 border-b-2 border-primary-600 pb-1' : ''
                    }`}
                  >
                    Post Job
                  </Link>
                )}
                
                {session?.user && (
                  <Link 
                    href={
                      session.user.role === 'EMPLOYER' ? '/dashboard/employer' :
                      session.user.role === 'RECRUITER' ? '/dashboard/recruiter' :
                      '/dashboard/employee'
                    }
                    className={`text-gray-600 hover:text-gray-900 transition-colors font-medium ${
                      pathname.startsWith('/dashboard') ? 'text-primary-600 border-b-2 border-primary-600 pb-1' : ''
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
              </div>
              
              {/* User Section - Enhanced with recruiter status */}
              <div className="flex items-center gap-4 relative user-menu">
                {status === 'loading' ? (
                  <div className="loading-spinner w-6 h-6" />
                ) : session ? (
                  /* Authenticated User Menu */
                  <>
                    {/* Enhanced notifications for recruiters */}
                    {session.user.role === 'RECRUITER' && session.user.recruiterProfile?.isActive && (
                      <button 
                        onClick={() => setShowNotificationsPanel(true)}
                        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors mr-2"
                      >
                        <Bell className="w-6 h-6" />
                        {/* Notification badge would go here */}
                      </button>
                    )}

                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {session.user.image ? (
                          <img 
                            src={session.user.image} 
                            alt={session.user.name} 
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary-600" />
                          </div>
                        )}
                        <div className="hidden sm:block text-left">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                            {session.user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getRoleLabel(session.user.role)}
                            {/* Show approval status for recruiters */}
                            {session.user.role === 'RECRUITER' && !session.user.recruiterProfile?.isActive && (
                              <span className="ml-1 text-yellow-600">(Pending)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>

                    {/* Enhanced Dropdown Menu with recruiter status */}
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                        >
                          {/* User Info with Status */}
                          <div className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              {session.user.image ? (
                                <img 
                                  src={session.user.image} 
                                  alt={session.user.name} 
                                  className="w-12 h-12 rounded-full"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                  <User className="w-6 h-6 text-primary-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {session.user.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {session.user.email}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(session.user.role)}`}>
                                    {session.user.role === 'EMPLOYER' && <Building className="w-3 h-3 mr-1" />}
                                    {session.user.role === 'RECRUITER' && <UserCheck className="w-3 h-3 mr-1" />}
                                    {session.user.role === 'EMPLOYEE' && <User className="w-3 h-3 mr-1" />}
                                    {getRoleLabel(session.user.role)}
                                  </span>
                                  {/* Approval status for recruiters */}
                                  {session.user.role === 'RECRUITER' && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      session.user.recruiterProfile?.isActive 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {session.user.recruiterProfile?.isActive ? 'Active' : 'Pending'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-2">
                            {/* Only show dashboard if user has access */}
                            {(session.user.role !== 'RECRUITER' || session.user.recruiterProfile?.isActive) && (
                              <button
                                onClick={handleDashboardRedirect}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Briefcase className="w-4 h-4" />
                                Go to Dashboard
                              </button>
                            )}
                            
                            <button
                              onClick={() => {
                                router.push('/auth/profile/edit')
                                setShowUserMenu(false)
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <Settings className="w-4 h-4" />
                              Edit Profile
                            </button>
                            
                            {/* Show approval status for pending recruiters */}
                            {session.user.role === 'RECRUITER' && !session.user.recruiterProfile?.isActive && (
                              <button
                                onClick={() => {
                                  router.push('/auth/recruiter-approval')
                                  setShowUserMenu(false)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors"
                              >
                                <Clock className="w-4 h-4" />
                                Check Approval Status
                              </button>
                            )}
                            
                            {/* Enhanced menu items based on role and access */}
                            {(session.user.role === 'EMPLOYER' || 
                              (session.user.role === 'RECRUITER' && session.user.recruiterProfile?.isActive)) && (
                              <button
                                onClick={() => {
                                  router.push('/post-job')
                                  setShowUserMenu(false)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                Post a Job
                              </button>
                            )}

                            <Link
                              href="/jobs"
                              onClick={() => setShowUserMenu(false)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <Search className="w-4 h-4" />
                              Jobs
                            </Link>
                          </div>

                          {/* Logout */}
                          <div className="border-t border-gray-100 pt-2">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  /* Unauthenticated User Buttons */
                  <>
                    <Link href="/auth/login" className="btn-secondary">
                      Sign In
                    </Link>
                    <Link href="/auth/register" className="btn-primary">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer remains the same... */}
        <footer className="bg-gray-900 text-white py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold">At Bench</span>
                </div>
                <p className="text-gray-400">
                  Connecting talent with opportunity in the modern world.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">For Job Seekers</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/jobs" className="hover:text-white transition-colors">Jobs</Link></li>
                  <li><Link href="/dashboard/employee" className="hover:text-white transition-colors">My Applications</Link></li>
                  <li><Link href="/auth/profile/edit" className="hover:text-white transition-colors">Create Profile</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">For Employers</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/post-job" className="hover:text-white transition-colors">Post a Job</Link></li>
                  <li><Link href="/dashboard/employer" className="hover:text-white transition-colors">Find Candidates</Link></li>
                  <li><Link href="/auth/register?role=employer" className="hover:text-white transition-colors">Employer Signup</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 At Bench. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </RecruiterAccessGuard>
  )
}