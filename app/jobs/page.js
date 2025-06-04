'use client'

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Building, 
  Clock, 
  DollarSign, 
  Filter, 
  MapPin, 
  Search, 
  Star 
} from 'lucide-react';
import SeedJobsButton from '../components/SeedJobsButton';
import useStore from '../store/authStore';

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
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">AKT Talents</span>
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
 
                <div className="flex justify-between items-start m-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <Building className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-gray-600">{job.company}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.type.replace('_', ' ')}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.salary}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {job.description}
                    </p>
                    
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.requirements.slice(0, 3).map((req, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {req}
                          </span>
                        ))}
                        {job.requirements.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            +{job.requirements.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6">
                    <button
                      onClick={() => handleApply(job.id)}
                      className="btn-primary"
                    >
                      Apply Now
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </p>
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