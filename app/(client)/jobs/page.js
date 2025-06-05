'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  Star 
} from 'lucide-react';
import SeedJobsButton from '../../components/SeedJobsButton';
import JobDescriptionRenderer from '../../components/JobDescriptionRenderer';
import useStore from '../../store/authStore';
import Image from 'next/image';

export default function Jobs() {
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
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) {
        toast.error('Please login to apply for jobs');
        return;
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, employeeId: user.id }),
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">
                <Image src={"/logo.svg"} alt="AKT Talents Logo" width={'300'} height={'120'}/>
              </span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="btn-secondary">
                Sign In
              </Link>
              <Link href="/auth/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/*** 
         * Seed Jobs Button
         * For dummy jobs for testing enable this button
         */}
        {/* <SeedJobsButton /> */}

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