// app/(client)/dashboard/recruiter/DashboardStats.js - Role-based access control
import { motion } from "framer-motion"
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Clock, 
  Target, 
  Award,
  Shield,
  AlertCircle
} from "lucide-react"

export default function DashboardStats({ 
  stats, 
  candidates, 
  isAdmin, 
  onTabChange, 
  canAccessRestrictedTabs = false 
}) {
  
  // Define stats based on user access level
  const getStatsConfig = () => {
    if (canAccessRestrictedTabs) {
      // Full access users (ADMIN, LEAD, HR, CS)
      return [
        {
          title: "Total Candidates",
          value: candidates?.length || 0,
          change: "+12%",
          trend: "up",
          icon: Users,
          color: "blue",
          description: "All candidates in system",
          onClick: () => onTabChange('candidates')
        },
        {
          title: "Active Placements",
          value: candidates?.filter(c => c.status === 'PLACED').length || 0,
          change: "+8%",
          trend: "up", 
          icon: Target,
          color: "green",
          description: "Successfully placed candidates",
          onClick: () => onTabChange('candidates')
        },
        {
          title: "Resume Database",
          value: stats.totalResumes || 0,
          change: "+15%",
          trend: "up",
          icon: FileText,
          color: "purple",
          description: "Total resumes uploaded",
          onClick: () => onTabChange('resumes')
        },
        {
          title: isAdmin ? "Team Size" : "Success Rate",
          value: isAdmin 
            ? stats.teamSize || 0
            : candidates?.length > 0 
              ? `${Math.round((candidates.filter(c => c.status === 'PLACED').length / candidates.length) * 100)}%`
              : "0%",
          change: isAdmin ? "+2" : "+5%",
          trend: "up",
          icon: isAdmin ? Shield : Award,
          color: "orange",
          description: isAdmin ? "Total team members" : "Placement success rate",
          onClick: isAdmin ? () => onTabChange('team') : undefined
        }
      ]
    } else {
      // Limited access users (TA, JUNIOR)
      return [
        {
          title: "Your Role",
          value: "Time Tracking",
          change: "Active",
          trend: "neutral",
          icon: Clock,
          color: "blue",
          description: "Current access level",
          onClick: () => onTabChange('time-management')
        },
        {
          title: "Notifications",
          value: stats.unreadNotifications || 0,
          change: "New",
          trend: stats.unreadNotifications > 0 ? "up" : "neutral",
          icon: AlertCircle,
          color: "yellow",
          description: "Unread notifications",
          onClick: undefined
        },
        {
          title: "Dashboard Access",
          value: "Available",
          change: "Full",
          trend: "neutral",
          icon: TrendingUp,
          color: "green",
          description: "View dashboard insights",
          onClick: () => onTabChange('dashboard')
        },
        {
          title: "Support",
          value: "Contact Admin",
          change: "Help",
          trend: "neutral",
          icon: Shield,
          color: "purple",
          description: "Need more access?",
          onClick: undefined
        }
      ]
    }
  }

  const statsConfig = getStatsConfig()

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />
      case 'down':
        return <TrendingUp className="w-4 h-4 rotate-180" />
      default:
        return <div className="w-4 h-4" />
    }
  }

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon
        
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${
              stat.onClick ? 'cursor-pointer hover:border-blue-300' : ''
            }`}
            onClick={stat.onClick}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                <Icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div className={`flex items-center gap-1 text-sm ${getTrendColor(stat.trend)}`}>
                {getTrendIcon(stat.trend)}
                <span className="font-medium">{stat.change}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>

            {/* Access Level Indicator */}
            {!canAccessRestrictedTabs && (
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-xs text-yellow-600 font-medium">Limited Access</span>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}