"use client";

import { useEffect, useState, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  Bell,
  Settings,
  LogOut,
  User,
  Search,
  Filter,
  Download,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Building,
  UserCheck,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Star,
  Plus,
  Briefcase,
  UserPlus,
  Upload,
  Link as LinkIcon,
  Unlink,
  X,
  MoreHorizontal,
  UserX,
  UserMinus,
  Target
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import CandidateManagement from "../../components/CandidateManagement";
import BulkResumeUpload from "../../components/BulkResumeUpload";
import ResumeMappingManager from "../../components/ResumeMappingManager";
import ResumeAnalyticsDashboard from "../../components/ResumeAnalyticsDashboard";
import TeamManagement from '../../components/TeamManagement';
import AdminDashboard from '../../components/AdminDashboard';


export default function RecruiterDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [resumes, setResumes] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [resumeAnalytics, setResumeAnalytics] = useState({});
  // Use useRef to persist the interval reference across re-renders
  const playIntervalRef = useRef(null);
  const notificationIntervalRef = useRef(null);

  const [stats, setStats] = useState({
    totalResumes: 0,
    mappedResumes: 0,
    unmappedResumes: 0,
    newApplications: 0,
    teamSize: 0,
    unreadNotifications: 0,
    candidatesWithResumes: 0,
    candidatesWithoutResumes: 0,
    candidatesByStatus: {}
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Candidate status management
  const [showQuickStatusModal, setShowQuickStatusModal] = useState(false);
  const [selectedCandidateForStatus, setSelectedCandidateForStatus] = useState(null);

  const user = session?.user;
  const isAdmin = user?.recruiterProfile?.recruiterType === "ADMIN";
  

  // Candidate status options
  const candidateStatuses = [
    { 
      value: 'ACTIVE', 
      label: 'Active', 
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: UserCheck,
      description: 'Available for new opportunities'
    },
    { 
      value: 'PLACED', 
      label: 'Placed', 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Target,
      description: 'Successfully placed in a position'
    },
    { 
      value: 'INACTIVE', 
      label: 'Inactive', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: UserMinus,
      description: 'Not currently seeking opportunities'
    },
    { 
      value: 'DO_NOT_CONTACT', 
      label: 'Do Not Contact', 
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: Shield,
      description: 'Should not be contacted'
    }
  ];

  const playNotificationSound = () => {
    const audio = new Audio("/notificationSound2.mp3");
    audio.play().catch((error) => {
      console.error("Failed to play notification sound:", error);
    });
  };

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

    // Initial fetch of all dashboard data
    fetchDashboardData();

    // Set up interval for fetching notifications every 1 minute
    notificationIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 60 * 1000); // 1 minute

    // Optional: Set up interval for refreshing dashboard data every 10 minutes (less frequent)
    const dashboardRefreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 10 * 60 * 1000); // 10 minutes

    // Cleanup function
    return () => {
      clearInterval(dashboardRefreshInterval);
      cleanupNotificationFetching();
      cleanupNotificationInterval();
    };

  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch resumes
      const resumesResponse = await fetch("/api/recruiter/resumes");
      if (resumesResponse.ok) {
        const resumesData = await resumesResponse.json();
        const resumesList = resumesData.resumes || resumesData;
        setResumes(resumesList);
      }

      // Fetch candidates
      const candidatesResponse = await fetch("/api/recruiter/candidates");
      if (candidatesResponse.ok) {
        const candidatesData = await candidatesResponse.json();
        const candidatesList = candidatesData.candidates || candidatesData;
        setCandidates(candidatesList);

        // Calculate status distribution
        const statusDistribution = candidatesList.reduce((acc, candidate) => {
          acc[candidate.status] = (acc[candidate.status] || 0) + 1;
          return acc;
        }, {});

        setStats(prevStats => ({
          ...prevStats,
          candidatesByStatus: statusDistribution
        }));
      }

      // Fetch resume analytics
      const analyticsResponse = await fetch("/api/recruiter/resumes/analytics");
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setResumeAnalytics(analyticsData);
        
        // Update stats with analytics data
        setStats(prevStats => ({
          ...prevStats,
          totalResumes: analyticsData.summary?.totalResumes || 0,
          mappedResumes: analyticsData.summary?.mappedResumes || 0,
          unmappedResumes: analyticsData.summary?.unmappedUserResumes || 0,
          candidatesWithResumes: analyticsData.summary?.candidatesWithResumes || 0,
          candidatesWithoutResumes: analyticsData.summary?.candidatesWithoutResumes || 0
        }));
      }

      // Fetch team members (if admin)
      if (isAdmin) {
        const teamResponse = await fetch("/api/recruiter/team");
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          const teamList = teamData.teamMembers || teamData;
          setTeamMembers(teamList);

          if (teamData.stats) {
            setStats((prevStats) => ({
              ...prevStats,
              teamSize: teamData.stats.total || teamList.length,
            }));
          }
        }
      } 
      
      // Fetch notifications once during initial load
      await fetchNotifications();

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // Separate function to fetch only notifications
  const fetchNotifications = async () => {
    try {
      const notificationsResponse = await fetch("/api/recruiter/notifications");
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        const notificationsList =
          notificationsData.notifications || notificationsData;

        const now = Date.now();
        const threeMinutesAgo = now - 20 * 60 * 1000;
        const relevantNotifications = notificationsList.filter(
          (n) => new Date(n.createdAt).getTime() > threeMinutesAgo
        );
        setNotifications(relevantNotifications);

        const unreadCount =
          notificationsData.pagination?.unread ||
          notificationsList.filter((n) => !n.isRead).length;

        // Only manage sound interval if unread count changed
        const previousUnreadCount = stats.unreadNotifications;
        
        if (unreadCount > 0) {
          // Start sound if we have unread notifications and no interval is running
          if (!playIntervalRef.current) {
            startNotificationSound();
          }
        } else {
          // Stop sound if no unread notifications
          cleanupNotificationInterval();
        }

        setStats((prevStats) => ({
          ...prevStats,
          unreadNotifications: unreadCount,
        }));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Don't show toast for notification fetch errors to avoid spam
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch("/api/recruiter/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId,
          isRead: true,
        }),
      });

      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );

        const newUnreadCount = Math.max(0, stats.unreadNotifications - 1);
        
        setStats((prevStats) => ({
          ...prevStats,
          unreadNotifications: newUnreadCount,
        }));

        // Only clear interval if no more unread notifications
        if (newUnreadCount === 0) {
          cleanupNotificationInterval();
        }
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch("/api/recruiter/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => ({
            ...notification,
            isRead: true,
          }))
        );

        setStats((prevStats) => ({
          ...prevStats,
          unreadNotifications: 0,
        }));

        // Clear interval since all notifications are read
        cleanupNotificationInterval();

        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast.error("Failed to update notifications");
    }
  };

// Add cleanup function
const cleanupNotificationInterval = () => {
  if (playIntervalRef.current) {
    clearInterval(playIntervalRef.current);
    playIntervalRef.current = null;
  }
};
// Add cleanup function for notification fetching
const cleanupNotificationFetching = () => {
  if (notificationIntervalRef.current) {
    clearInterval(notificationIntervalRef.current);
    notificationIntervalRef.current = null;
  }
};

// Add function to start notification sound
const startNotificationSound = () => {
  cleanupNotificationInterval(); // Clear any existing interval first
  playIntervalRef.current = setInterval(() => {
    playNotificationSound();
  }, 20000);
};
  const handleQuickStatusUpdate = async (candidateId, newStatus, candidateName) => {
    try {
      const response = await fetch('/api/recruiter/candidates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          status: newStatus
        })
      });

      if (response.ok) {
        const statusLabel = candidateStatuses.find(s => s.value === newStatus)?.label || newStatus;
        toast.success(`${candidateName}'s status updated to ${statusLabel}`);
        await fetchDashboardData(); // Refresh all data
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
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleUploadSuccess = (results) => {
    console.log('Upload successful:', results);
    fetchDashboardData(); // Refresh all data
  };

  const handleMappingUpdate = (result) => {
    console.log('Mapping updated:', result);
    fetchDashboardData(); // Refresh all data
  };

  const getCandidateStatusColor = (status) => {
    const statusConfig = candidateStatuses.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCandidateStatusIcon = (status) => {
    const statusConfig = candidateStatuses.find(s => s.value === status);
    return statusConfig?.icon || UserCheck;
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 text-primary-600" />
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
    const matchesExperience =
      !experienceFilter || resume.experienceLevel === experienceFilter;

    return matchesSearch && matchesExperience;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalResumes}
                </p>
                <p className="text-gray-600">Total Resumes</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.mappedResumes}
                </p>
                <p className="text-gray-600">Mapped</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Unlink className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.unmappedResumes}
                </p>
                <p className="text-gray-600">Unmapped</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {candidates.length}
                </p>
                <p className="text-gray-600">Candidates</p>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.teamSize}
                  </p>
                  <p className="text-gray-600">Team Members</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Candidate Status Overview */}
        {Object.keys(stats.candidatesByStatus).length > 0 && (
          <div className="bg-white p-6 rounded-lg border mb-8">
            <h3 className="text-lg font-semibold mb-4">Candidate Status Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {candidateStatuses.map(status => {
                const count = stats.candidatesByStatus[status.value] || 0;
                const Icon = status.icon;
                
                return (
                  <div key={status.value} className="text-center">
                    <div className={`p-4 rounded-lg border ${status.color}`}>
                      <Icon className="w-8 h-8 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm">{status.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Enhanced Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {/* Dashboard Tab - Enhanced for Admins */}
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "dashboard"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
                {/* {isAdmin && pendingRequests.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {pendingRequests.length}
                  </span>
                )} */}
              </button>

              <button
                onClick={() => setActiveTab("candidates")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "candidates"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                Manage Candidates
              </button>

              <button
                onClick={() => setActiveTab("bulk-upload")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "bulk-upload"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Bulk Upload
              </button>

              <button
                onClick={() => setActiveTab("resume-mapping")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "resume-mapping"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <LinkIcon className="w-4 h-4 inline mr-2" />
                Resume Mapping
              </button>

              <button
                onClick={() => setActiveTab("resumes")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "resumes"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                All Resumes
              </button>

              {isAdmin && (
                <>
                <button
                  onClick={() => setActiveTab("team")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "team"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Team Management
                </button>

                <button
                onClick={() => setActiveTab("analytics")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "analytics"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Analytics
                </button>
                </>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Enhanced Dashboard Tab */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {isAdmin ? (
                  // Admin Dashboard with approval management
                  <AdminDashboard />
                ) : (
                  // Regular recruiter dashboard
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Dashboard Overview
                    </h2>
                    
                    {/* Regular dashboard content... */}
                    {/* Recent Candidates with Quick Status Update */}
                    <div className="bg-white p-6 rounded-lg border">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Recent Candidates</h3>
                        <button
                          onClick={() => setActiveTab("candidates")}
                          className="btn btn-ghost btn-sm text-primary-600"
                        >
                          View All
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {candidates.slice(0, 5).map((candidate, index) => (
                          <motion.div
                            key={candidate.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-primary-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                                <p className="text-sm text-gray-600">{candidate.email}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCandidateStatusColor(candidate.status)}`}>
                                {candidateStatuses.find(s => s.value === candidate.status)?.label || candidate.status}
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedCandidateForStatus(candidate);
                                  setShowQuickStatusModal(true);
                                }}
                                className="btn btn-ghost btn-sm text-gray-600 hover:text-gray-700"
                                title="Update status"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Resume Analytics */}
                    {resumeAnalytics.experienceDistribution && (
                      <div className="bg-white p-6 rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Resume Experience Distribution</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {resumeAnalytics.experienceDistribution.map((item, index) => (
                            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                              <div className="text-2xl font-bold text-primary-600">{item.count}</div>
                              <div className="text-sm text-gray-600">
                                {item.level.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white p-6 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                          onClick={() => setActiveTab("candidates")}
                          className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <UserPlus className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <div className="font-medium">Add Candidate</div>
                        </button>
                        <button
                          onClick={() => setActiveTab("bulk-upload")}
                          className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <Upload className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <div className="font-medium">Bulk Upload</div>
                        </button>
                        <button
                          onClick={() => setActiveTab("resume-mapping")}
                          className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <LinkIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                          <div className="font-medium">Map Resumes</div>
                        </button>
                        <Link
                          href="/post-job"
                          className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 block"
                        >
                          <Briefcase className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                          <div className="font-medium">Post Job</div>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Other tabs remain the same... */}
            {activeTab === "candidates" && <CandidateManagement />}
            {activeTab === "bulk-upload" && (
              <BulkResumeUpload 
                candidates={candidates}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={(errors) => console.error('Upload errors:', errors)}
              />
            )}
            {activeTab === "resume-mapping" && (
              <ResumeMappingManager 
                candidates={candidates}
                onMappingUpdate={handleMappingUpdate}
              />
            )}
            {activeTab === "resumes" && (
              // Resume content stays the same...
              <div className="space-y-6">
                {/* Existing resume content */}
              </div>
            )}
            {activeTab === "team" && isAdmin && (
              <TeamManagement />
            )}
            {activeTab === "analytics" && isAdmin && (
              <ResumeAnalyticsDashboard />
            )}
          </div>
        </div>
      </div>

      {/* Quick Status Update Modal */}
      {showQuickStatusModal && selectedCandidateForStatus && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowQuickStatusModal(false);
              setSelectedCandidateForStatus(null);
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Update Status</h3>
              <button
                onClick={() => {
                  setShowQuickStatusModal(false);
                  setSelectedCandidateForStatus(null);
                }}
                className="btn btn-ghost btn-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Candidate:</h4>
                <p className="text-sm text-gray-600">
                  <strong>{selectedCandidateForStatus.name}</strong> ({selectedCandidateForStatus.email})
                </p>
              </div>

              <div>
                <label className="form-label">Select New Status</label>
                <div className="space-y-2">
                  {candidateStatuses.map(status => {
                    const Icon = status.icon;
                    const isCurrentStatus = status.value === selectedCandidateForStatus.status;
                    
                    return (
                      <button
                        key={status.value}
                        onClick={() => {
                          if (!isCurrentStatus) {
                            handleQuickStatusUpdate(
                              selectedCandidateForStatus.id, 
                              status.value, 
                              selectedCandidateForStatus.name
                            );
                          }
                        }}
                        disabled={isCurrentStatus}
                        className={`w-full p-4 text-left border rounded-lg transition-colors ${
                          isCurrentStatus 
                            ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50' 
                            : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <div>
                            <div className="font-medium">{status.label}</div>
                            <div className="text-sm text-gray-600">{status.description}</div>
                          </div>
                          {isCurrentStatus && (
                            <span className="ml-auto text-xs text-gray-500">(Current)</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Floating Notifications Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={() => setShowNotificationsPanel(true)}
          className="relative bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <Bell className="w-6 h-6" />
          {stats.unreadNotifications > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
            >
              {stats.unreadNotifications > 99
                ? "99+"
                : stats.unreadNotifications}
            </motion.span>
          )}
        </button>
      </motion.div>

      {/* Notifications Panel */}
      {showNotificationsPanel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNotificationsPanel(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Notifications
                </h2>
                {stats.unreadNotifications > 0 && (
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                    {stats.unreadNotifications} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {stats.unreadNotifications > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotificationsPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[60vh] p-6">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No notifications
                  </h3>
                  <p className="text-gray-600">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        notification.isRead
                          ? "border-gray-200 bg-white hover:bg-gray-50"
                          : "border-blue-200 bg-blue-50 hover:bg-blue-100"
                      }`}
                      onClick={() =>
                        !notification.isRead &&
                        markNotificationAsRead(notification.id)
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notification.type === "SUCCESS"
                              ? "bg-green-100 text-green-600"
                              : notification.type === "WARNING"
                              ? "bg-yellow-100 text-yellow-600"
                              : notification.type === "ERROR"
                              ? "bg-red-100 text-red-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {notification.type === "SUCCESS" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : notification.type === "WARNING" ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : notification.type === "ERROR" ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <p className="text-gray-600 text-sm mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {new Date(notification.createdAt).toLocaleString()}
                          </div>
                        </div>

                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}