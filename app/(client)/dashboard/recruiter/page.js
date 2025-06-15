"use client";
import { useEffect, useState, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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

  // Candidate status management
  const [showQuickStatusModal, setShowQuickStatusModal] = useState(false);
  const [selectedCandidateForStatus, setSelectedCandidateForStatus] = useState(null);

  const notificationsHook = useNotifications(stats.unreadNotifications, setStats);

  const user = session?.user;
  const isAdmin = user?.recruiterProfile?.recruiterType === "ADMIN";

  // Candidate status options (duplicated for modal, could be moved to a shared file if desired)
  const candidateStatuses = [
    { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800 border-green-200', icon: 'UserCheck', description: 'Available for new opportunities' },
    { value: 'PLACED', label: 'Placed', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: 'Target', description: 'Successfully placed in a position' },
    { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: 'UserMinus', description: 'Not currently seeking opportunities' },
    { value: 'DO_NOT_CONTACT', label: 'Do Not Contact', color: 'bg-red-100 text-red-800 border-red-200', icon: 'Shield', description: 'Should not be contacted' }
  ];

  // -- Original dashboard data fetching logic --
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
    // Set up notification polling
    notificationsHook.startNotificationPolling();
    // Set up dashboard refresh interval
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
      // Fetch team members (if admin)
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
      }
      // Fetch notifications once during initial load
      await notificationsHook.fetchNotifications();
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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

  // Candidate status color/icon helpers
  const getCandidateStatusColor = (status) => candidateStatuses.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  const getCandidateStatusIcon = (status) => candidateStatuses.find(s => s.value === status)?.icon || 'UserCheck';

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

  // Filtered Resumes
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardStats stats={stats} candidates={candidates} isAdmin={isAdmin} />
        {/* Candidate Status Overview, Tab Navigation */}
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdmin={isAdmin}
          stats={stats}
          candidateStatuses={candidateStatuses}
        />
        <div className="p-6">
          {activeTab === "dashboard" && (
            isAdmin ? (
              <AdminDashboard />
            ) : (
              <div className="space-y-6">
                {/* Recruiter dashboard overview, recent candidates, analytics, quick actions */}
                {/* Copy your regular recruiter dashboard content here */}
              </div>
            )
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
              {/* Your resume tab content goes here */}
            </div>
          )}
          {activeTab === "team" && isAdmin && <TeamManagement />}
          {activeTab === "analytics" && isAdmin && <ResumeAnalyticsDashboard />}
        </div>
      </div>
      {/* Quick Status Modal */}
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
      {/* Floating Notifications Button and Notifications Panel */}
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