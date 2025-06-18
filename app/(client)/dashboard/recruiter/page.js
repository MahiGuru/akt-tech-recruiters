// app/(client)/dashboard/recruiter/page.js (Optimized to prevent reloads)
"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

// Components
import DashboardStats from "./DashboardStats";
import DashboardTabs from "./DashboardTabs";
import QuickStatusModal from "./QuickStatusModal";
import NotificationsPanel from "./NotificationsPanel";

import CandidateManagement from "../../components/candidate-management";
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
import ResumeDatabase from "../../components/ResumeDatabase";

export default function RecruiterDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Refs to prevent unnecessary re-initializations
  const initRef = useRef({ 
    isInitialized: false, 
    isInitializing: false,
    lastUserId: null 
  });
  const dataCache = useRef(new Map());
  const intervalRef = useRef(null);

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
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickStatusModal, setShowQuickStatusModal] = useState(false);
  const [selectedCandidateForStatus, setSelectedCandidateForStatus] = useState(null);

  const user = session?.user;
  const userId = user?.id;
  const isAdmin = useMemo(() => user?.recruiterProfile?.recruiterType === "ADMIN", [user?.recruiterProfile?.recruiterType]);

  // Candidate status options (memoized)
  const candidateStatuses = useMemo(() => [
    { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800 border-green-200', icon: 'UserCheck', description: 'Available for new opportunities' },
    { value: 'PLACED', label: 'Placed', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: 'Target', description: 'Successfully placed in a position' },
    { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: 'UserMinus', description: 'Not currently seeking opportunities' },
    { value: 'DO_NOT_CONTACT', label: 'Do Not Contact', color: 'bg-red-100 text-red-800 border-red-200', icon: 'Shield', description: 'Should not be contacted' }
  ], []);

  // Optimized API functions with caching
  const fetchWithCache = useCallback(async (url, cacheKey, force = false) => {
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    const cached = dataCache.current.get(cacheKey);
    
    if (!force && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        dataCache.current.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }
    } catch (error) {
      console.error(`Error fetching ${cacheKey}:`, error);
    }
    return null;
  }, []);

  // Initialize dashboard data
  const initializeDashboard = useCallback(async () => {
    if (initRef.current.isInitializing || initRef.current.lastUserId === userId) {
      return;
    }

    initRef.current.isInitializing = true;
    initRef.current.lastUserId = userId;

    try {
      setIsLoading(true);

      // Fetch all required data in parallel
      const [candidatesData, analyticsData, notificationsData, teamData] = await Promise.all([
        fetchWithCache("/api/recruiter/candidates", "candidates", true),
        fetchWithCache("/api/recruiter/resumes/analytics", "analytics", true),
        fetchWithCache("/api/recruiter/notifications", "notifications", true),
        isAdmin ? fetchWithCache("/api/recruiter/team", "team", true) : Promise.resolve(null)
      ]);

      // Update state
      if (candidatesData) {
        const candidatesList = candidatesData.candidates || candidatesData;
        setCandidates(candidatesList);
        
        const statusDistribution = candidatesList.reduce((acc, candidate) => {
          acc[candidate.status] = (acc[candidate.status] || 0) + 1;
          return acc;
        }, {});
        setStats(prev => ({ ...prev, candidatesByStatus: statusDistribution }));
      }

      if (analyticsData) {
        setResumeAnalytics(analyticsData);
        setStats(prev => ({
          ...prev,
          totalResumes: analyticsData.summary?.totalResumes || 0,
          mappedResumes: analyticsData.summary?.mappedResumes || 0,
          unmappedResumes: analyticsData.summary?.unmappedUserResumes || 0,
          candidatesWithResumes: analyticsData.summary?.candidatesWithResumes || 0,
          candidatesWithoutResumes: analyticsData.summary?.candidatesWithoutResumes || 0
        }));
      }

      if (notificationsData) {
        const notificationsList = notificationsData.notifications || notificationsData;
        setNotifications(notificationsList);
        
        const unread = notificationsData.pagination?.unread || notificationsList.filter(n => !n.isRead).length;
        setUnreadCount(unread);
        setStats(prev => ({ ...prev, unreadNotifications: unread }));
      }

      if (teamData && isAdmin) {
        setTeamMembers(teamData.teamMembers || teamData);
        if (teamData.stats) {
          setStats(prev => ({
            ...prev,
            teamSize: teamData.stats.total || (teamData.teamMembers?.length ?? 0),
          }));
        }
      }

      // Setup periodic notification refresh (only)
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(async () => {
        const notifData = await fetchWithCache("/api/recruiter/notifications", "notifications", true);
        if (notifData) {
          const notifList = notifData.notifications || notifData;
          setNotifications(notifList);
          const unreadCount = notifData.pagination?.unread || notifList.filter(n => !n.isRead).length;
          setUnreadCount(unreadCount);
        }
      }, 2 * 60 * 1000); // Every 2 minutes

      initRef.current.isInitialized = true;
    } catch (error) {
      console.error("Error initializing dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      initRef.current.isInitializing = false;
    }
  }, [userId, isAdmin, fetchWithCache]);

  // Handle tab changes without full reloads
  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
  }, []);

  // Notification functions
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
        // Update local state
        setCandidates(prev => 
          prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c)
        );
        
        // Clear cache
        dataCache.current.delete('candidates');
        
        toast.success(`${candidateName}'s status updated`);
        setShowQuickStatusModal(false);
        setSelectedCandidateForStatus(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Something went wrong');
    }
  }, []);

  // Optimized upload/update handlers
  const handleUploadSuccess = useCallback(async () => {
    dataCache.current.delete('resumes');
    dataCache.current.delete('analytics');
    
    const [resumesData, analyticsData] = await Promise.all([
      fetchWithCache("/api/recruiter/resumes", "resumes", true),
      fetchWithCache("/api/recruiter/resumes/analytics", "analytics", true)
    ]);
    
    if (resumesData) setResumes(resumesData.resumes || resumesData);
    if (analyticsData) setResumeAnalytics(analyticsData);
    
    toast.success("Upload successful!");
  }, [fetchWithCache]);

  const handleMappingUpdate = useCallback(async () => {
    ['resumes', 'candidates', 'analytics'].forEach(key => dataCache.current.delete(key));
    
    const [resumesData, candidatesData, analyticsData] = await Promise.all([
      fetchWithCache("/api/recruiter/resumes", "resumes", true),
      fetchWithCache("/api/recruiter/candidates", "candidates", true),
      fetchWithCache("/api/recruiter/resumes/analytics", "analytics", true)
    ]);
    
    if (resumesData) setResumes(resumesData.resumes || resumesData);
    if (candidatesData) setCandidates(candidatesData.candidates || candidatesData);
    if (analyticsData) setResumeAnalytics(analyticsData);
  }, [fetchWithCache]);

  // Regular Dashboard Component (memoized)
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
            <p className="text-blue-100 text-lg">Here's your recruiting overview for today</p>
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

      {/* Recent candidates section */}
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

  // Effect to initialize dashboard (minimal dependencies)
  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }
    
    if (session?.user?.role !== "RECRUITER") {
      router.push("/dashboard/employee");
      return;
    }
    
    if (!initRef.current.isInitialized && userId) {
      initializeDashboard();
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, session?.user?.role, userId, router, initializeDashboard]);

  // Loading state
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
        <DashboardStats 
          stats={stats} 
          candidates={candidates} 
          isAdmin={isAdmin} 
          onTabChange={handleTabChange}
        />
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          isAdmin={isAdmin}
        />

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 min-h-[600px]">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="p-6">
              {isAdmin ? <AdminDashboard /> : RegularRecruiterDashboard}
            </div>
          )}

          {/* Candidates Tab */}
          {activeTab === "candidates" && (
            <div className="p-6">
              <CandidateManagement />
            </div>
          )}

          {/* Other tabs remain the same... */}
          {activeTab === "bulk-upload" && (
            <div className="p-6">
              <BulkResumeUpload
                candidates={candidates}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={(msg) => toast.error(msg)}
              />
            </div>
          )}

          {activeTab === "resume-mapping" && (
            <div className="p-6">
              <ResumeMappingManager
                candidates={candidates}
                onMappingUpdate={handleMappingUpdate}
              />
            </div>
          )}

          {activeTab === "resumes" && (
            <div className="p-6">
              <ResumeDatabase
                isAdmin={isAdmin}
                currentUserId={userId}
              />
            </div>
          )}

          {/* Admin tabs */}
          {isAdmin && activeTab === "team" && (
            <div className="p-6">
              <TeamManagement />
            </div>
          )}

          {isAdmin && activeTab === "analytics" && (
            <div className="p-6">
              <ResumeAnalyticsDashboard />
            </div>
          )}
        </div>
      </div>

      {/* Status Modal */}
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

      {/* Notifications */}
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