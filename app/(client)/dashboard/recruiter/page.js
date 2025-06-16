// app/(client)/dashboard/recruiter/page.js (Fixed Browser Tab Reloading - Final)
"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Components
import DashboardStats from "./DashboardStats";
import DashboardTabs from "./DashboardTabs";
import QuickStatusModal from "./QuickStatusModal";
import NotificationsPanel from "./NotificationsPanel";
import useNotifications from "./useNotifications";

import CandidateManagement from "../../components/CandidateManagement";
import BulkResumeUpload from "../../components/BulkResumeUpload";
import ResumeMappingManager from "../../components/ResumeMappingManager";
import ResumeAnalyticsDashboard from "../../components/ResumeAnalyticsDashboard";
import TeamManagement from '../../components/TeamManagement';
import AdminDashboard from '../../components/AdminDashboard';

// Icons
import { 
  Users, 
  Target, 
  Calendar, 
  TrendingUp, 
  Activity,
  FileText,
  CheckCircle,
  Clock,
  Star,
  Award,
  Zap,
  BarChart3
} from 'lucide-react';

export default function RecruiterDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Single source of truth for initialization
  const dashboardState = useRef({
    isInitialized: false,
    currentUserId: null,
    lastInitTime: 0,
    isLoading: false
  });
  
  const dataCache = useRef({});
  const intervalRefs = useRef([]);

  // Core state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [resumes, setResumes] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [resumeAnalytics, setResumeAnalytics] = useState({});
  const [stats, setStats] = useState({
    totalResumes: 0,
    mappedResumes: 0,
    unmappedResumes: 0,
    newApplications: 0,
    teamSize: 0,
    unreadNotifications: 0,
    candidatesWithResumes: 0,
    candidatesWithoutResumes: 0,
    candidatesByStatus: {},
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState({});

  // Enhanced UI state
  const [recentActivity, setRecentActivity] = useState([]);
  const [quickStats, setQuickStats] = useState({});

  // Candidate status management
  const [showQuickStatusModal, setShowQuickStatusModal] = useState(false);
  const [selectedCandidateForStatus, setSelectedCandidateForStatus] = useState(null);

  // Create a stable notifications hook that won't cause re-renders
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = session?.user;
  const userId = user?.id;
  const isAdmin = useMemo(() => user?.recruiterProfile?.recruiterType === "ADMIN", [user]);

  // Candidate status options
  const candidateStatuses = useMemo(() => [
    { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800 border-green-200', icon: 'UserCheck', description: 'Available for new opportunities' },
    { value: 'PLACED', label: 'Placed', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: 'Target', description: 'Successfully placed in a position' },
    { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: 'UserMinus', description: 'Not currently seeking opportunities' },
    { value: 'DO_NOT_CONTACT', label: 'Do Not Contact', color: 'bg-red-100 text-red-800 border-red-200', icon: 'Shield', description: 'Should not be contacted' }
  ], []);

  // Stable API functions that won't change reference
  const apiFunctions = useMemo(() => ({
    fetchResumes: async (force = false) => {
      const cacheKey = 'resumes';
      const cacheTime = 5 * 60 * 1000;
      
      if (!force && dataCache.current[cacheKey] && 
          Date.now() - dataCache.current[`${cacheKey}Timestamp`] < cacheTime) {
        return dataCache.current[cacheKey];
      }

      try {
        const response = await fetch("/api/recruiter/resumes");
        if (response.ok) {
          const data = await response.json();
          const resumesData = data.resumes || data;
          dataCache.current[cacheKey] = resumesData;
          dataCache.current[`${cacheKey}Timestamp`] = Date.now();
          setResumes(resumesData);
          return resumesData;
        }
      } catch (error) {
        console.error("Error fetching resumes:", error);
      }
      return [];
    },

    fetchCandidates: async (force = false) => {
      const cacheKey = 'candidates';
      const cacheTime = 2 * 60 * 1000;
      
      if (!force && dataCache.current[cacheKey] && 
          Date.now() - dataCache.current[`${cacheKey}Timestamp`] < cacheTime) {
        return dataCache.current[cacheKey];
      }

      try {
        const response = await fetch("/api/recruiter/candidates");
        if (response.ok) {
          const data = await response.json();
          const candidatesData = data.candidates || data;
          dataCache.current[cacheKey] = candidatesData;
          dataCache.current[`${cacheKey}Timestamp`] = Date.now();
          setCandidates(candidatesData);
          
          const statusDistribution = candidatesData.reduce((acc, candidate) => {
            acc[candidate.status] = (acc[candidate.status] || 0) + 1;
            return acc;
          }, {});
          setStats(prev => ({ ...prev, candidatesByStatus: statusDistribution }));
          return candidatesData;
        }
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
      return [];
    },

    fetchAnalytics: async (force = false) => {
      const cacheKey = 'analytics';
      const cacheTime = 10 * 60 * 1000;
      
      if (!force && dataCache.current[cacheKey] && 
          Date.now() - dataCache.current[`${cacheKey}Timestamp`] < cacheTime) {
        return dataCache.current[cacheKey];
      }

      try {
        const response = await fetch("/api/recruiter/resumes/analytics");
        if (response.ok) {
          const analyticsData = await response.json();
          dataCache.current[cacheKey] = analyticsData;
          dataCache.current[`${cacheKey}Timestamp`] = Date.now();
          setResumeAnalytics(analyticsData);
          setStats(prev => ({
            ...prev,
            totalResumes: analyticsData.summary?.totalResumes || 0,
            mappedResumes: analyticsData.summary?.mappedResumes || 0,
            unmappedResumes: analyticsData.summary?.unmappedUserResumes || 0,
            candidatesWithResumes: analyticsData.summary?.candidatesWithResumes || 0,
            candidatesWithoutResumes: analyticsData.summary?.candidatesWithoutResumes || 0
          }));
          return analyticsData;
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
      return {};
    },

    fetchTeamData: async (force = false) => {
      if (!isAdmin) return {};
      
      const cacheKey = 'team';
      const cacheTime = 5 * 60 * 1000;
      
      if (!force && dataCache.current[cacheKey] && 
          Date.now() - dataCache.current[`${cacheKey}Timestamp`] < cacheTime) {
        return dataCache.current[cacheKey];
      }

      try {
        const response = await fetch("/api/recruiter/team");
        if (response.ok) {
          const teamData = await response.json();
          dataCache.current[cacheKey] = teamData;
          dataCache.current[`${cacheKey}Timestamp`] = Date.now();
          setTeamMembers(teamData.teamMembers || teamData);
          if (teamData.stats) {
            setStats(prev => ({
              ...prev,
              teamSize: teamData.stats.total || (teamData.teamMembers?.length ?? 0),
            }));
          }
          return teamData;
        }
      } catch (error) {
        console.error("Error fetching team data:", error);
      }
      return {};
    },

    fetchPerformanceData: async (force = false) => {
      if (!isAdmin) return {};
      
      const cacheKey = 'performance';
      const cacheTime = 10 * 60 * 1000;
      
      if (!force && dataCache.current[cacheKey] && 
          Date.now() - dataCache.current[`${cacheKey}Timestamp`] < cacheTime) {
        return dataCache.current[cacheKey];
      }

      try {
        const response = await fetch("/api/recruiter/admin/performance");
        if (response.ok) {
          const performanceData = await response.json();
          dataCache.current[cacheKey] = performanceData;
          dataCache.current[`${cacheKey}Timestamp`] = Date.now();
          setRecentActivity(performanceData.activity || []);
          setQuickStats(performanceData.metrics || {});
          return performanceData;
        }
      } catch (error) {
        console.error("Error fetching performance data:", error);
      }
      return {};
    },

    fetchNotifications: async () => {
      try {
        const response = await fetch("/api/recruiter/notifications");
        if (response.ok) {
          const data = await response.json();
          const notificationsList = data.notifications || data;
          setNotifications(notificationsList);
          
          const unread = data.pagination?.unread || notificationsList.filter(n => !n.isRead).length;
          setUnreadCount(unread);
          setStats(prev => ({ ...prev, unreadNotifications: unread }));
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }
  }), [isAdmin]);

  // Clear all intervals
  const clearAllIntervals = useCallback(() => {
    intervalRefs.current.forEach(interval => {
      if (interval) clearInterval(interval);
    });
    intervalRefs.current = [];
  }, []);

  // Initialize dashboard data ONCE
  const initializeDashboard = useCallback(async () => {
    // Prevent multiple initializations
    if (dashboardState.current.isLoading || 
        dashboardState.current.isInitialized ||
        dashboardState.current.currentUserId === userId) {
      return;
    }

    dashboardState.current.isLoading = true;
    dashboardState.current.currentUserId = userId;
    
    try {
      setIsLoading(true);
      
      // Clear any existing intervals
      clearAllIntervals();
      
      // Load all data
      await Promise.all([
        apiFunctions.fetchCandidates(true),
        apiFunctions.fetchAnalytics(true),
        apiFunctions.fetchNotifications(),
        isAdmin ? apiFunctions.fetchTeamData(true) : Promise.resolve(),
        isAdmin ? apiFunctions.fetchPerformanceData(true) : Promise.resolve()
      ]);
      
      // Setup minimal polling only for notifications
      const notificationInterval = setInterval(apiFunctions.fetchNotifications, 2 * 60 * 1000);
      intervalRefs.current.push(notificationInterval);
      
      dashboardState.current.isInitialized = true;
      dashboardState.current.lastInitTime = Date.now();
    } catch (error) {
      console.error("Error initializing dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      dashboardState.current.isLoading = false;
    }
  }, [userId, isAdmin, apiFunctions, clearAllIntervals]);

  // Handle tab changes
  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
    
    // Load data if needed (but don't force reload)
    const loadData = async () => {
      setTabLoading(prev => ({ ...prev, [newTab]: true }));
      
      try {
        switch (newTab) {
          case 'dashboard':
            await apiFunctions.fetchCandidates();
            break;
          case 'candidates':
            await apiFunctions.fetchCandidates();
            break;
          case 'resumes':
          case 'bulk-upload':
          case 'resume-mapping':
            await Promise.all([apiFunctions.fetchResumes(), apiFunctions.fetchCandidates()]);
            break;
          case 'team':
          case 'analytics':
            if (isAdmin) {
              await Promise.all([apiFunctions.fetchTeamData(), apiFunctions.fetchPerformanceData()]);
            }
            break;
        }
      } catch (error) {
        console.error(`Error loading ${newTab} data:`, error);
      } finally {
        setTabLoading(prev => ({ ...prev, [newTab]: false }));
      }
    };

    loadData();
  }, [apiFunctions, isAdmin]);

  // Simple notification functions
  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetch("/api/recruiter/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, isRead: true }),
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        setStats(prev => ({ ...prev, unreadNotifications: Math.max(0, prev.unreadNotifications - 1) }));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/recruiter/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        setStats(prev => ({ ...prev, unreadNotifications: 0 }));
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      toast.error("Failed to update notifications");
    }
  }, []);

  // Quick status update
  const handleQuickStatusUpdate = useCallback(async (candidateId, newStatus, candidateName) => {
    try {
      const response = await fetch('/api/recruiter/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, status: newStatus })
      });
      
      if (response.ok) {
        // Invalidate candidates cache
        delete dataCache.current.candidates;
        delete dataCache.current.candidatesTimestamp;
        
        toast.success(`${candidateName}'s status updated to ${candidateStatuses.find(s => s.value === newStatus)?.label || newStatus}`);
        await apiFunctions.fetchCandidates(true);
        setShowQuickStatusModal(false);
        setSelectedCandidateForStatus(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update candidate status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Something went wrong while updating status');
    }
  }, [candidateStatuses, apiFunctions]);

  // Handle upload success
  const handleUploadSuccess = useCallback(async () => {
    delete dataCache.current.resumes;
    delete dataCache.current.resumesTimestamp;
    delete dataCache.current.analytics;
    delete dataCache.current.analyticsTimestamp;
    
    await Promise.all([apiFunctions.fetchResumes(true), apiFunctions.fetchAnalytics(true)]);
    toast.success("Upload successful!");
  }, [apiFunctions]);

  // Handle mapping update
  const handleMappingUpdate = useCallback(async () => {
    delete dataCache.current.resumes;
    delete dataCache.current.resumesTimestamp;
    delete dataCache.current.candidates;
    delete dataCache.current.candidatesTimestamp;
    delete dataCache.current.analytics;
    delete dataCache.current.analyticsTimestamp;
    
    await Promise.all([
      apiFunctions.fetchResumes(true), 
      apiFunctions.fetchCandidates(true), 
      apiFunctions.fetchAnalytics(true)
    ]);
  }, [apiFunctions]);

  // Filtered resumes
  const filteredResumes = useMemo(() => {
    return resumes.filter((resume) => {
      const matchesSearch =
        resume.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.candidate?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.candidate?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesExperience = !experienceFilter || resume.experienceLevel === experienceFilter;
      return matchesSearch && matchesExperience;
    });
  }, [resumes, searchTerm, experienceFilter]);

  // Regular Dashboard Component
  const RegularRecruiterDashboard = useMemo(() => (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-blue-100 text-lg">Heres your recruiting overview for today</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-xl p-4">
            <Activity className="w-12 h-12 text-white" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Your Candidates",
            value: candidates.length,
            subtitle: `${candidates.filter(c => c.status === 'ACTIVE').length} active`,
            icon: Users,
            color: "blue",
            onClick: () => handleTabChange('candidates')
          },
          {
            title: "Resume Database",
            value: stats.totalResumes,
            subtitle: `${stats.mappedResumes} mapped`,
            icon: FileText,
            color: "green",
            onClick: () => handleTabChange('resumes')
          },
          {
            title: "Placed This Month",
            value: candidates.filter(c => c.status === 'PLACED').length,
            subtitle: "Great progress!",
            icon: Target,
            color: "purple"
          },
          {
            title: "Success Rate",
            value: candidates.length > 0 
              ? `${Math.round((candidates.filter(c => c.status === 'PLACED').length / candidates.length) * 100)}%`
              : "0%",
            subtitle: "Keep it up!",
            icon: Award,
            color: "orange"
          }
        ].map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * (index + 1) }}
            className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${card.onClick ? 'cursor-pointer' : ''}`}
            onClick={card.onClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className={`text-${card.color}-600 text-sm mt-1`}>{card.subtitle}</p>
              </div>
              <div className={`bg-${card.color}-100 rounded-lg p-3`}>
                <card.icon className={`w-6 h-6 text-${card.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Candidates</h3>
          <button
            onClick={() => handleTabChange('candidates')}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            View All →
          </button>
        </div>

        {candidates.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No candidates yet</h4>
            <p className="text-gray-600 mb-4">Start by adding your first candidate</p>
            <button
              onClick={() => handleTabChange('candidates')}
              className="btn btn-primary"
            >
              <Users className="w-4 h-4" />
              Add Candidate
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.slice(0, 5).map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                    <p className="text-sm text-gray-600">{candidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    candidateStatuses.find(s => s.value === candidate.status)?.color || 'bg-gray-100 text-gray-800'
                  }`}>
                    {candidate.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(candidate.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  ), [candidates, stats, user, candidateStatuses, handleTabChange]);

  // Main effect - ONLY run when absolutely necessary
  useEffect(() => {
    // Don't do anything while loading
    if (status === "loading") return;
    
    // Handle authentication
    if (status === "unauthenticated") {            // definitely logged-out
      router.replace("/auth/login");
      return;
    }
    
    if (session.user.role !== "RECRUITER") {
      router.push("/dashboard/employee");
      return;
    }
    
    if (!dashboardState.current.isInitialized) {
      initializeDashboard();                       // runs only once per user
    }

    // Only initialize if we haven't already for this user
    if (userId && !dashboardState.current.isInitialized && 
        dashboardState.current.currentUserId !== userId) {
      initializeDashboard();
    }
    
    return () => {
      // Only cleanup if we're actually changing users
      if (dashboardState.current.currentUserId !== userId) {
        clearAllIntervals();
        dashboardState.current.isInitialized = false;
      }
    };
  }, [status, session?.user?.role, userId, initializeDashboard]); // Minimal dependencies

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="loading-spinner w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Fetching your recruiting data...</p>
        </motion.div>
      </div>
    );
  }

  if (!session || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardStats stats={stats} candidates={candidates} isAdmin={isAdmin} />
        
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          isAdmin={isAdmin}
        />

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 min-h-[600px]">
          <div className={`p-6 ${activeTab === "dashboard" ? "block" : "hidden"}`}>
            {tabLoading.dashboard ? (
              <div className="flex items-center justify-center h-96">
                <div className="loading-spinner w-8 h-8 text-primary-600" />
              </div>
            ) : (
              isAdmin ? <AdminDashboard /> : RegularRecruiterDashboard
            )}
          </div>

          <div className={`p-6 ${activeTab === "candidates" ? "block" : "hidden"}`}>
            {tabLoading.candidates ? (
              <div className="flex items-center justify-center h-96">
                <div className="loading-spinner w-8 h-8 text-primary-600" />
              </div>
            ) : (
              <CandidateManagement />
            )}
          </div>

          <div className={`p-6 ${activeTab === "bulk-upload" ? "block" : "hidden"}`}>
            {tabLoading["bulk-upload"] ? (
              <div className="flex items-center justify-center h-96">
                <div className="loading-spinner w-8 h-8 text-primary-600" />
              </div>
            ) : (
              <BulkResumeUpload
                candidates={candidates}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={(msg) => toast.error(msg)}
              />
            )}
          </div>

          <div className={`p-6 ${activeTab === "resume-mapping" ? "block" : "hidden"}`}>
            {tabLoading["resume-mapping"] ? (
              <div className="flex items-center justify-center h-96">
                <div className="loading-spinner w-8 h-8 text-primary-600" />
              </div>
            ) : (
              <ResumeMappingManager
                candidates={candidates}
                onMappingUpdate={handleMappingUpdate}
              />
            )}
          </div>

          <div className={`p-6 ${activeTab === "resumes" ? "block" : "hidden"}`}>
            {tabLoading.resumes ? (
              <div className="flex items-center justify-center h-96">
                <div className="loading-spinner w-8 h-8 text-primary-600" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Resume Database</h2>
                  <div className="text-sm text-gray-600">
                    {filteredResumes.length} of {resumes.length} resumes
                  </div>
                </div>
              </div>
            )}
          </div>

          {isAdmin && (
            <>
              <div className={`p-6 ${activeTab === "team" ? "block" : "hidden"}`}>
                {tabLoading.team ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="loading-spinner w-8 h-8 text-primary-600" />
                  </div>
                ) : (
                  <TeamManagement />
                )}
              </div>

              <div className={`p-6 ${activeTab === "analytics" ? "block" : "hidden"}`}>
                {tabLoading.analytics ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="loading-spinner w-8 h-8 text-primary-600" />
                  </div>
                ) : (
                  <ResumeAnalyticsDashboard />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <QuickStatusModal
        open={showQuickStatusModal}
        candidate={selectedCandidateForStatus}
        candidateStatuses={candidateStatuses}
        onClose={() => {
          setShowQuickStatusModal(false);
          setSelectedCandidateForStatus(null);
        }}
        onStatusChange={handleQuickStatusUpdate}
      />

      {/* Simple notifications */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <button
            onClick={() => setShowNotificationsPanel(true)}
            className="relative bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg"
          >
            <span className="sr-only">Notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </motion.div>
      )}

      <NotificationsPanel
        open={showNotificationsPanel}
        onClose={() => setShowNotificationsPanel(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        markNotificationAsRead={markNotificationAsRead}
        markAllNotificationsAsRead={markAllNotificationsAsRead}
      />
    </div>
  );
}