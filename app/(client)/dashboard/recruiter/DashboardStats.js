import { FileText, Link as LinkIcon, Unlink, Users, Shield } from "lucide-react";
export default function DashboardStats({ stats, candidates, isAdmin }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalResumes}</p>
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
            <p className="text-2xl font-bold text-gray-900">{stats.mappedResumes}</p>
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
            <p className="text-2xl font-bold text-gray-900">{stats.unmappedResumes}</p>
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
            <p className="text-2xl font-bold text-gray-900">{candidates?.length ?? 0}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.teamSize}</p>
              <p className="text-gray-600">Team Members</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}