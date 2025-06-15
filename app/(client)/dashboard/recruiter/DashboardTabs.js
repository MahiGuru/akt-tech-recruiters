import { BarChart3, UserPlus, Upload, Link as LinkIcon, FileText, Users, TrendingUp } from "lucide-react";
export default function DashboardTabs({ activeTab, setActiveTab, isAdmin }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "dashboard" ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            {isAdmin ? "Admin Dashboard" : "Dashboard"}
          </button>
          <button
            onClick={() => setActiveTab("candidates")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "candidates" ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" /> Manage Candidates
          </button>
          <button
            onClick={() => setActiveTab("bulk-upload")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "bulk-upload" ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            <Upload className="w-4 h-4 inline mr-2" /> Bulk Upload
          </button>
          <button
            onClick={() => setActiveTab("resume-mapping")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "resume-mapping" ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            <LinkIcon className="w-4 h-4 inline mr-2" /> Resume Mapping
          </button>
          <button
            onClick={() => setActiveTab("resumes")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "resumes" ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            <FileText className="w-4 h-4 inline mr-2" /> All Resumes
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab("team")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "team" ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              >
                <Users className="w-4 h-4 inline mr-2" /> Team Management
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "analytics" ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" /> Analytics
              </button>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}