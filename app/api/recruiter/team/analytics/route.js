// app/api/recruiter/team/analytics/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../(client)/lib/auth'
import { prisma } from '../../../../(client)/lib/prisma'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin recruiter
    const adminProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id }
    })

    if (!adminProfile || adminProfile.recruiterType !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const timeRange = parseInt(searchParams.get('timeRange') || '30', 10) // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)

    // Determine if current user is main admin
    const isMainAdmin = !adminProfile.adminId

    // Function to get all team members recursively
    const getAllTeamMembers = async (adminId) => {
      const directReports = await prisma.recruiter.findMany({
        where: { adminId: adminId, isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      let allMembers = [...directReports]

      // Get subordinates of admin members
      for (const member of directReports) {
        if (member.recruiterType === 'ADMIN') {
          const subordinates = await getAllTeamMembers(member.userId)
          allMembers = allMembers.concat(subordinates)
        }
      }

      return allMembers
    }

    // Get team members
    let teamMembers = []
    if (isMainAdmin) {
      // Main admin sees entire organization
      teamMembers = await getAllTeamMembers(session.user.id)
      
      // Add main admin to the team
      const mainAdminData = await prisma.recruiter.findUnique({
        where: { userId: session.user.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
      if (mainAdminData) {
        teamMembers.unshift(mainAdminData)
      }
    } else {
      // Sub-admin sees only their direct reports
      teamMembers = await getAllTeamMembers(session.user.id)
    }

    const teamUserIds = teamMembers.map(member => member.userId)

    // Get performance metrics for each team member
    const performanceData = await Promise.all(
      teamMembers.map(async (member) => {
        const userId = member.userId

        // Candidates added by this recruiter
        const [candidatesAdded, totalCandidates, placedCandidates] = await Promise.all([
          prisma.candidate.count({
            where: {
              addedById: userId,
              createdAt: { gte: startDate }
            }
          }),
          prisma.candidate.count({
            where: { addedById: userId }
          }),
          prisma.candidate.count({
            where: {
              addedById: userId,
              status: 'PLACED'
            }
          })
        ])

        // Applications and interviews in time range
        const [applicationsSubmitted, interviewsScheduled, completedInterviews] = await Promise.all([
          prisma.application.count({
            where: {
              submittedById: userId,
              createdAt: { gte: startDate }
            }
          }),
          prisma.interview.count({
            where: {
              scheduledById: userId,
              createdAt: { gte: startDate }
            }
          }),
          prisma.interview.count({
            where: {
              scheduledById: userId,
              status: 'COMPLETED'
            }
          })
        ])

        // Resumes uploaded for their candidates
        const resumesUploaded = await prisma.resume.count({
          where: {
            candidate: {
              addedById: userId
            },
            createdAt: { gte: startDate }
          }
        })

        const placementRate = totalCandidates > 0 ? Math.round((placedCandidates / totalCandidates) * 100) : 0
        const interviewCompletionRate = interviewsScheduled > 0 ? Math.round((completedInterviews / interviewsScheduled) * 100) : 0

        return {
          recruiter: {
            id: member.id,
            userId: member.userId,
            name: member.user.name,
            email: member.user.email,
            recruiterType: member.recruiterType,
            department: member.department,
            isMainAdmin: isMainAdmin && member.userId === session.user.id
          },
          metrics: {
            candidatesAdded,
            totalCandidates,
            placedCandidates,
            placementRate,
            applicationsSubmitted,
            interviewsScheduled,
            completedInterviews,
            interviewCompletionRate,
            resumesUploaded,
            // Performance score calculation
            performanceScore: calculatePerformanceScore({
              placementRate,
              candidatesAdded,
              interviewCompletionRate,
              applicationsSubmitted
            })
          }
        }
      })
    )

    // Calculate team-wide metrics
    const teamMetrics = {
      totalCandidates: performanceData.reduce((sum, p) => sum + p.metrics.totalCandidates, 0),
      totalPlaced: performanceData.reduce((sum, p) => sum + p.metrics.placedCandidates, 0),
      totalApplications: performanceData.reduce((sum, p) => sum + p.metrics.applicationsSubmitted, 0),
      totalInterviews: performanceData.reduce((sum, p) => sum + p.metrics.interviewsScheduled, 0),
      totalResumes: performanceData.reduce((sum, p) => sum + p.metrics.resumesUploaded, 0),
      averagePlacementRate: performanceData.length > 0 
        ? Math.round(performanceData.reduce((sum, p) => sum + p.metrics.placementRate, 0) / performanceData.length)
        : 0,
      topPerformer: performanceData.reduce((top, current) => 
        current.metrics.performanceScore > (top?.metrics?.performanceScore || 0) ? current : top
      , null)
    }

    // Get historical data for trends
    const trendData = await getPerformanceTrends(teamUserIds, timeRange)

    // Calculate growth rate
    const growthRate = calculateGrowthRate(trendData)

    // Get recent activities
    const recentActivities = await getRecentTeamActivities(teamUserIds, 20)

    // Department breakdown
    const departmentStats = teamMembers.reduce((acc, member) => {
      const dept = member.department || 'No Department'
      if (!acc[dept]) {
        acc[dept] = { count: 0, members: [] }
      }
      acc[dept].count++
      acc[dept].members.push({
        name: member.user.name,
        role: member.recruiterType
      })
      return acc
    }, {})

    return NextResponse.json({
      metrics: {
        ...teamMetrics,
        teamSize: teamMembers.length,
        growthRate
      },
      performance: performanceData,
      trends: trendData,
      activities: recentActivities,
      departments: departmentStats,
      timeRange: {
        days: timeRange,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      isMainAdmin
    })

  } catch (error) {
    console.error('Error fetching team analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to calculate performance score
function calculatePerformanceScore({ placementRate, candidatesAdded, interviewCompletionRate, applicationsSubmitted }) {
  // Weighted scoring algorithm
  const weights = {
    placementRate: 0.4,      // 40% weight
    candidatesAdded: 0.3,    // 30% weight
    interviewCompletionRate: 0.2, // 20% weight
    applicationsSubmitted: 0.1    // 10% weight
  }

  // Normalize values to 0-100 scale
  const normalizedPlacementRate = Math.min(placementRate, 100)
  const normalizedCandidatesAdded = Math.min((candidatesAdded / 10) * 100, 100) // Scale: 10 candidates = 100 points
  const normalizedInterviewCompletionRate = Math.min(interviewCompletionRate, 100)
  const normalizedApplicationsSubmitted = Math.min((applicationsSubmitted / 5) * 100, 100) // Scale: 5 applications = 100 points

  const score = (
    normalizedPlacementRate * weights.placementRate +
    normalizedCandidatesAdded * weights.candidatesAdded +
    normalizedInterviewCompletionRate * weights.interviewCompletionRate +
    normalizedApplicationsSubmitted * weights.applicationsSubmitted
  )

  return Math.round(score)
}

// Helper function to get performance trends
async function getPerformanceTrends(teamUserIds, timeRange) {
  const trends = []
  const days = Math.min(timeRange, 30) // Limit to 30 days for performance

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const [candidatesCount, applicationsCount, interviewsCount] = await Promise.all([
      prisma.candidate.count({
        where: {
          addedById: { in: teamUserIds },
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      }),
      prisma.application.count({
        where: {
          submittedById: { in: teamUserIds },
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      }),
      prisma.interview.count({
        where: {
          scheduledById: { in: teamUserIds },
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      })
    ])

    trends.push({
      date: date.toISOString().split('T')[0],
      candidates: candidatesCount,
      applications: applicationsCount,
      interviews: interviewsCount
    })
  }

  return trends
}

// Helper function to calculate growth rate
function calculateGrowthRate(trendData) {
  if (trendData.length < 7) return 0

  const recentWeek = trendData.slice(-7)
  const previousWeek = trendData.slice(-14, -7)

  const recentTotal = recentWeek.reduce((sum, day) => sum + day.candidates + day.applications, 0)
  const previousTotal = previousWeek.reduce((sum, day) => sum + day.candidates + day.applications, 0)

  if (previousTotal === 0) return recentTotal > 0 ? 100 : 0

  return Math.round(((recentTotal - previousTotal) / previousTotal) * 100)
}

// Helper function to get recent team activities
async function getRecentTeamActivities(teamUserIds, limit = 20) {
  const [recentCandidates, recentApplications, recentInterviews] = await Promise.all([
    prisma.candidate.findMany({
      where: { addedById: { in: teamUserIds } },
      include: {
        addedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    }),
    prisma.application.findMany({
      where: { submittedById: { in: teamUserIds } },
      include: {
        submittedBy: { select: { name: true } },
        job: { select: { title: true, company: true } },
        candidate: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    }),
    prisma.interview.findMany({
      where: { scheduledById: { in: teamUserIds } },
      include: {
        scheduledBy: { select: { name: true } },
        candidate: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  ])

  // Combine and sort activities
  const activities = [
    ...recentCandidates.map(candidate => ({
      type: 'candidate_added',
      title: `${candidate.addedBy.name} added candidate ${candidate.name}`,
      subtitle: candidate.email,
      time: candidate.createdAt,
      actor: candidate.addedBy.name
    })),
    ...recentApplications.map(app => ({
      type: 'application_submitted',
      title: `${app.submittedBy?.name} applied ${app.candidate?.name} to ${app.job.company}`,
      subtitle: app.job.title,
      time: app.createdAt,
      actor: app.submittedBy?.name
    })),
    ...recentInterviews.map(interview => ({
      type: 'interview_scheduled',
      title: `${interview.scheduledBy.name} scheduled interview with ${interview.candidate.name}`,
      subtitle: interview.title,
      time: interview.createdAt,
      actor: interview.scheduledBy.name
    }))
  ]
  .sort((a, b) => new Date(b.time) - new Date(a.time))
  .slice(0, limit)

  return activities
}