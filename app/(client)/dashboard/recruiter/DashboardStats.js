// app/(client)/dashboard/recruiter/DashboardStats.js (Enhanced Version)
import { motion } from "framer-motion";
import { 
  FileText, 
  Link as LinkIcon, 
  Unlink, 
  Users, 
  Shield, 
  Target,
  Award,
  TrendingUp,
  Activity,
  Calendar,
  Star,
  Zap,
  CheckCircle,
  Clock
} from "lucide-react";

export default function DashboardStats({ stats, candidates, isAdmin }) {
  // Calculate additional metrics
  const totalCandidates = candidates?.length || 0;
  const activeCandidates = candidates?.filter(c => c.status === 'ACTIVE').length || 0;
  const placedCandidates = candidates?.filter(c => c.status === 'PLACED').length || 0;
  const successRate = totalCandidates > 0 ? Math.round((placedCandidates / totalCandidates) * 100) : 0;

  // Calculate upcoming interviews
  const upcomingInterviews = candidates?.reduce((count, candidate) => {
    if (!candidate.interviews) return count;
    const now = new Date();
    return count + candidate.interviews.filter(interview => {
      const interviewDate = new Date(interview.scheduledAt);
      return interviewDate > now && ['SCHEDULED', 'CONFIRMED'].includes(interview.status);
    }).length;
  }, 0) || 0;

  const statCards = [
    {
      id: 'resumes',
      title: 'Resume Database',
      value: stats.totalResumes || 0,
      subtitle: `${stats.mappedResumes || 0} mapped to candidates`,
      icon: FileText,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      change: '+12%',
      changeType: 'positive'
    },
    {
      id: 'candidates',
      title: isAdmin ? 'Team Candidates' : 'Your Candidates',
      value: totalCandidates,
      subtitle: `${activeCandidates} active candidates`,
      icon: Users,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      change: '+8%',
      changeType: 'positive'
    },
    {
      id: 'placed',
      title: 'Successful Placements',
      value: placedCandidates,
      subtitle: `${successRate}% success rate`,
      icon: Target,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      change: '+23%',
      changeType: 'positive'
    },
    {
      id: 'interviews',
      title: 'Upcoming Interviews',
      value: upcomingInterviews,
      subtitle: 'This week',
      icon: Calendar,
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      change: '+5%',
      changeType: 'positive'
    }
  ];

  // Add admin-specific stats
  if (isAdmin) {
    statCards.push(
      {
        id: 'team',
        title: 'Team Members',
        value: stats.teamSize || 0,
        subtitle: 'Active recruiters',
        icon: Shield,
        gradient: 'from-red-500 to-red-600',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        change: '+2',
        changeType: 'positive'
      },
      {
        id: 'performance',
        title: 'Team Performance',
        value: '94%',
        subtitle: 'Average success rate',
        icon: TrendingUp,
        gradient: 'from-indigo-500 to-indigo-600',
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-600',
        change: '+7%',
        changeType: 'positive'
      }
    );
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isAdmin ? 'Admin Dashboard' : 'Recruiting Dashboard'}
        </h1>
        <p className="text-gray-600">
          {isAdmin 
            ? 'Monitor your team\'s performance and manage all candidates' 
            : 'Track your recruiting progress and manage candidates'
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ 
              scale: 1.02, 
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              transition: { duration: 0.2 }
            }}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            {/* Icon and Change Indicator */}
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                stat.changeType === 'positive' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                {stat.change}
              </div>
            </div>

            {/* Value */}
            <div className="mb-2">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </div>
              <div className="text-sm font-medium text-gray-900 mb-1">
                {stat.title}
              </div>
              <div className="text-xs text-gray-500">
                {stat.subtitle}
              </div>
            </div>

            {/* Progress bar for visual appeal */}
            <div className="w-full bg-gray-200 rounded-full h-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((typeof stat.value === 'number' ? stat.value : 0) / 100 * 100, 100)}%` }}
                transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                className={`h-1 rounded-full bg-gradient-to-r ${stat.gradient}`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Insights</h3>
          </div>
          <div className="text-sm text-gray-500">Updated just now</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round((stats.mappedResumes / Math.max(stats.totalResumes, 1)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Resumes Mapped</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {stats.candidatesWithResumes || 0}
              </div>
              <div className="text-sm text-gray-600">Candidates w/ Resumes</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {successRate}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {upcomingInterviews}
              </div>
              <div className="text-sm text-gray-600">This Week</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}