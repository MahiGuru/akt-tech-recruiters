'use client'

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Briefcase, 
  Building, 
  Clock, 
  IndianRupeeIcon, 
  Filter,
  MapPin, 
  Search, 
  Star,
  User,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react';
import SeedJobsButton from '../components/SeedJobsButton';
import JobDescriptionRenderer from '../components/JobDescriptionRenderer';
import useStore from '../store/authStore';
import Image from 'next/image';

export default function Jobs() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const {
    jobs,
    setJobs,
    searchTerm,
    setSearchTerm,
    locationFilter,
    setLocationFilter,
    typeFilter,
    setTypeFilter,
  } = useStore();
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [setJobs]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = !typeFilter || job.type === typeFilter;
    
    return matchesSearch && matchesLocation && matchesType;
  });

  const handleApply = async (jobId) => {
    if (!session) {
      toast.error('Please sign in to apply for jobs');
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, employeeId: session.user.id }),
      });

      if (response.ok) {
        toast.success('Application submitted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to apply');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleDashboardRedirect = () => {
    if (session?.user?.role === 'EMPLOYER') {
      router.push('/dashboard/employer');
    } else if (session?.user?.role === 'RECRUITER') {
      router.push('/dashboard/recruiter');
    } else {
      router.push('/dashboard/employee');
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
    setShowUserMenu(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="At Bench Logo" width={300} height={120}/>
            </Link>
            
            <div className="flex items-center gap-4">
              {status === 'loading' ? (
                <div className="loading-spinner w-6 h-6" />
              ) : session ? (
                /* Authenticated User Menu */
                <div className="relative user-menu">
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
                      <span className="hidden sm:block text-gray-700 font-medium">
                        {session.user.name}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          {session.user.image ? (
                            <img 
                              src={session.user.image} 
                              alt={session.user.name} 
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-primary-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {session.user.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {session.user.email}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                              session.user.role === 'EMPLOYER' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {session.user.role === 'EMPLOYER' ? 'Employer' : 'Job Seeker'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            handleDashboardRedirect();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Briefcase className="w-4 h-4" />
                          Go to Dashboard
                        </button>
                        
                        <button
                          onClick={() => {
                            router.push('/profile/edit');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Edit Profile
                        </button>
                        
                        {session.user.role === 'EMPLOYER' && (
                          <button
                            onClick={() => {
                              router.push('/post-job');
                              setShowUserMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Star className="w-4 h-4" />
                            Post a Job
                          </button>
                        )}
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
                </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/*** 
         * Seed Jobs Button
         * For dummy jobs for testing enable this button
         */}
        <SeedJobsButton />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Next Job</h1>
          <p className="text-xl text-gray-600">Discover amazing opportunities from top companies</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs or companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Job Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="REMOTE">Remote</option>
            </select>
            
            <button className="btn-primary justify-center flex">
              <Filter className="w-5 h-5" />
              Search
            </button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </div>
          ) : (
            filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Job Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <Building className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-gray-600 font-medium">{job.company}</p>
                      </div>
                    </div>
                    
                    {/* Job Meta Information */}
                    <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{job.type?.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IndianRupeeIcon className="w-4 h-4" />
                        <span className="font-medium text-green-600">{job.salary}</span>
                      </div>
                    </div>
                    
                    {/* Job Description with Rich Text Rendering */}
                    <div className="mb-4">
                      <JobDescriptionRenderer 
                        description={job.description || 'No description available'} 
                        maxLength={200}
                      />
                    </div>
                    
                    {/* Job Skills/Requirements Tags */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Required Skills:</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 5).map((skill, idx) => (
                            <span 
                              key={idx} 
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 5 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              +{job.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Job Requirements */}
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Requirements:</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.requirements.slice(0, 3).map((req, idx) => (
                            <span 
                              key={idx} 
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                            >
                              {req}
                            </span>
                          ))}
                          {job.requirements.length > 3 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              +{job.requirements.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Job Benefits */}
                    {job.benefits && job.benefits.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Benefits:</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.benefits.slice(0, 3).map((benefit, idx) => (
                            <span 
                              key={idx} 
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                            >
                              ✨ {benefit}
                            </span>
                          ))}
                          {job.benefits.length > 3 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              +{job.benefits.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Apply Button and Date */}
                  <div className="ml-6 flex flex-col items-end">
                    <button
                      onClick={() => handleApply(job.id)}
                      className="btn-primary mb-3 whitespace-nowrap"
                    >
                      Apply Now
                    </button>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                      {job.jobTypes && job.jobTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 justify-end">
                          {job.jobTypes.slice(0, 2).map((type, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium"
                            >
                              {type.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}