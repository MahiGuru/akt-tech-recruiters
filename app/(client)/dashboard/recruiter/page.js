// app/(client)/dashboard/recruiter/page.js (Enhanced Version)
"use client";
import { useEffect, useState } from "react";
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

  // Enhanced UI state
  const [recentActivity, setRecentActivity] = useState([]);
  const [quickStats, setQuickStats] = useState({});

  // Candidate status management
  const [showQuickStatusModal, setShowQuickStatusModal] = useState(false);
  const [selectedCandidateForStatus, setSelectedCandidateForStatus] = useState(null);

  const notificationsHook = useNotifications(stats.unreadNotifications, setStats);

  const user = session?.user;
  const isAdmin = user?.recruiterProfile?.recruiterType === "ADMIN";

  // Candidate status options
  const candidateStatuses = [
    { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800 border-green-200', icon: 'UserCheck', description: 'Available for new opportunities' },
    { value: 'PLACED', label: 'Placed', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: 'Target', description: 'Successfully placed in a position' },
    { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: 'UserMinus', description: 'Not currently seeking opportunities' },
    { value: 'DO_NOT_CONTACT', label: 'Do Not Contact', color: 'bg-red-100 text-red-800 border-red-200', icon: 'Shield', description: 'Should not be contacted' }
  ];

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login");
      return;
    }
    if (session.user.role !== "RECRUITER") {
      router.push("/dashboard/employee");
      return;
    }
    fetchDashboardData();
    notificationsHook.startNotificationPolling();
    
    const dashboardRefreshInterval = setInterval(fetchDashboardData, 10 * 60 * 1000);
    return () => {
      clearInterval(dashboardRefreshInterval);
      notificationsHook.cleanupNotificationPolling();
    };
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch resumes
      const resumesResponse = await fetch("/api/recruiter/resumes");
      if (resumesResponse.ok) {
        const resumesData = await resumesResponse.json();
        setResumes(resumesData.resumes || resumesData);
      }
      
      // Fetch candidates
      const candidatesResponse = await fetch("/api/recruiter/candidates");
      if (candidatesResponse.ok) {
        const candidatesData = await candidatesResponse.json();
        const candidatesList = candidatesData.candidates || candidatesData;
        setCandidates(candidatesList);
        
        const statusDistribution = candidatesList.reduce((acc, candidate) => {
          acc[candidate.status] = (acc[candidate.status] || 0) + 1;
          return acc;
        }, {});
        setStats(prevStats => ({ ...prevStats, candidatesByStatus: statusDistribution }));
      }
      
      // Fetch resume analytics
      const analyticsResponse = await fetch("/api/recruiter/resumes/analytics");
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setResumeAnalytics(analyticsData);
        setStats(prevStats => ({
          ...prevStats,
          totalResumes: analyticsData.summary?.totalResumes || 0,
          mappedResumes: analyticsData.summary?.mappedResumes || 0,
          unmappedResumes: analyticsData.summary?.unmappedUserResumes || 0,
          candidatesWithResumes: analyticsData.summary?.candidatesWithResumes || 0,
          candidatesWithoutResumes: analyticsData.summary?.candidatesWithoutResumes || 0
        }));
      }
      
      // Fetch team members and performance (if admin)
      if (isAdmin) {
        const teamResponse = await fetch("/api/recruiter/team");
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          setTeamMembers(teamData.teamMembers || teamData);
          if (teamData.stats) {
            setStats(prevStats => ({
              ...prevStats,
              teamSize: teamData.stats.total || (teamData.teamMembers?.length ?? 0),
            }));
          }
        }

        // Fetch recent activity for admin
        const performanceResponse = await fetch("/api/recruiter/admin/performance");
        if (performanceResponse.ok) {
          const performanceData = await performanceResponse.json();
          setRecentActivity(performanceData.activity || []);
          setQuickStats(performanceData.metrics || {});
        }
      }
      
      await notificationsHook.fetchNotifications();
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick status update logic
  const handleQuickStatusUpdate = async (candidateId, newStatus, candidateName) => {
    try {
      const response = await fetch('/api/recruiter/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, status: newStatus })
      });
      if (response.ok) {
        notificationsHook.toastSuccess(`${candidateName}'s status updated to ${candidateStatuses.find(s => s.value === newStatus)?.label || newStatus}`);
        await fetchDashboardData();
        setShowQuickStatusModal(false);
        setSelectedCandidateForStatus(null);
      } else {
        const error = await response.json();
        notificationsHook.toastError(error.message || 'Failed to update candidate status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      notificationsHook.toastError('Something went wrong while updating status');
    }
  };

  // Regular Recruiter Dashboard Component
  const RegularRecruiterDashboard = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
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

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setActiveTab('candidates')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Your Candidates</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{candidates.length}</p>
              <p className="text-green-600 text-sm mt-1">
                {candidates.filter(c => c.status === 'ACTIVE').length} active
              </p>
            </div>
            <div className="bg-blue-100 rounded-lg p-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setActiveTab('resumes')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Resume Database</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalResumes}</p>
              <p className="text-blue-600 text-sm mt-1">
                {stats.mappedResumes} mapped
              </p>
            </div>
            <div className="bg-green-100 rounded-lg p-3">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Placed This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {candidates.filter(c => c.status === 'PLACED').length}
              </p>
              <p className="text-purple-600 text-sm mt-1">Great progress!</p>
            </div>
            <div className="bg-purple-100 rounded-lg p-3">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {candidates.length > 0 
                  ? Math.round((candidates.filter(c => c.status === 'PLACED').length / candidates.length) * 100)
                  : 0}%
              </p>
              <p className="text-orange-600 text-sm mt-1">Keep it up!</p>
            </div>
            <div className="bg-orange-100 rounded-lg p-3">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Candidates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Candidates</h3>
          <button
            onClick={() => setActiveTab('candidates')}
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
              onClick={() => setActiveTab('candidates')}
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
  );

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

  const filteredResumes = resumes.filter((resume) => {
    const matchesSearch =
      resume.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.candidate?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.candidate?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExperience = !experienceFilter || resume.experienceLevel === experienceFilter;
    return matchesSearch && matchesExperience;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats */}
        <DashboardStats stats={stats} candidates={candidates} isAdmin={isAdmin} />
        
        {/* Enhanced Tab Navigation */}
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdmin={isAdmin}
        />

        {/* Tab Content with Enhanced Animations */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
          >
            {activeTab === "dashboard" && (
              isAdmin ? <AdminDashboard /> : <RegularRecruiterDashboard />
            )}
            {activeTab === "candidates" && <CandidateManagement />}
            {activeTab === "bulk-upload" && (
              <BulkResumeUpload
                candidates={candidates}
                onUploadSuccess={fetchDashboardData}
                onUploadError={notificationsHook.toastError}
              />
            )}
            {activeTab === "resume-mapping" && (
              <ResumeMappingManager
                candidates={candidates}
                onMappingUpdate={fetchDashboardData}
              />
            )}
            {activeTab === "resumes" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Resume Database</h2>
                  <div className="text-sm text-gray-600">
                    {filteredResumes.length} of {resumes.length} resumes
                  </div>
                </div>
                {/* Add your resume listing component here */}
              </div>
            )}
            {activeTab === "team" && isAdmin && <TeamManagement />}
            {activeTab === "analytics" && isAdmin && <ResumeAnalyticsDashboard />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Enhanced Modals */}
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

      {/* Enhanced Notifications */}
      {notificationsHook.renderFloatingButton(() => setShowNotificationsPanel(true))}
      <NotificationsPanel
        open={showNotificationsPanel}
        onClose={() => setShowNotificationsPanel(false)}
        notifications={notificationsHook.notifications}
        unreadCount={notificationsHook.unreadCount}
        markNotificationAsRead={notificationsHook.markNotificationAsRead}
        markAllNotificationsAsRead={notificationsHook.markAllNotificationsAsRead}
      />
    </div>
  );
}