// app/api/recruiter/admin/performance/route.js
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
    const timeRange = searchParams.get('timeRange') || '30' // days
    const days = parseInt(timeRange)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get all team members
    const teamMembers = await prisma.recruiter.findMany({
      where: {
        OR: [
          { adminId: session.user.id },
          { userId: session.user.id, recruiterType: 'ADMIN' }
        ],
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }
      }
    })

    const teamUserIds = teamMembers.map(member => member.userId)

    // Get performance metrics for each team member
    const performanceData = await Promise.all(
      teamMembers.map(async (member) => {
        const userId = member.userId

        // Candidates added by this recruiter
        const candidatesAdded = await prisma.candidate.count({
          where: {
            addedById: userId,
            createdAt: { gte: startDate }
          }
        })

        const totalCandidates = await prisma.candidate.count({
          where: { addedById: userId }
        })

        const placedCandidates = await prisma.candidate.count({
          where: {
            addedById: userId,
            status: 'PLACED'
          }
        })

        // Applications submitted by this recruiter
        const applicationsSubmitted = await prisma.application.count({
          where: {
            submittedById: userId,
            createdAt: { gte: startDate }
          }
        })

        // Interviews scheduled by this recruiter
        const interviewsScheduled = await prisma.interview.count({
          where: {
            scheduledById: userId,
            createdAt: { gte: startDate }
          }
        })

        const completedInterviews = await prisma.interview.count({
          where: {
            scheduledById: userId,
            status: 'COMPLETED'
          }
        })

        // Resumes uploaded for their candidates
        const resumesUploaded = await prisma.resume.count({
          where: {
            candidate: {
              addedById: userId
            },
            createdAt: { gte: startDate }
          }
        })

        return {
          recruiter: {
            id: member.id,
            userId: member.userId,
            name: member.user.name,
            email: member.user.email,
            recruiterType: member.recruiterType,
            department: member.department,
            joinedAt: member.user.createdAt
          },
          metrics: {
            candidatesAdded,
            totalCandidates,
            placedCandidates,
            placementRate: totalCandidates > 0 ? Math.round((placedCandidates / totalCandidates) * 100) : 0,
            applicationsSubmitted,
            interviewsScheduled,
            completedInterviews,
            interviewCompletionRate: interviewsScheduled > 0 ? Math.round((completedInterviews / interviewsScheduled) * 100) : 0,
            resumesUploaded
          }
        }
      })
    )

    // Get recent activity across the team
    const recentCandidates = await prisma.candidate.findMany({
      where: {
        addedById: { in: teamUserIds },
        createdAt: { gte: startDate }
      },
      include: {
        addedBy: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    const recentApplications = await prisma.application.findMany({
      where: {
        submittedById: { in: teamUserIds },
        createdAt: { gte: startDate }
      },
      include: {
        submittedBy: {
          select: { name: true }
        },
        job: {
          select: { title: true, company: true }
        },
        candidate: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    const recentInterviews = await prisma.interview.findMany({
      where: {
        scheduledById: { in: teamUserIds },
        createdAt: { gte: startDate }
      },
      include: {
        scheduledBy: {
          select: { name: true }
        },
        candidate: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Combine and format recent activity
    const recentActivity = [
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
    .slice(0, 50)
    .map(activity => ({
      ...activity,
      time: formatTimeAgo(activity.time)
    }))

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
        current.metrics.placementRate > (top?.metrics?.placementRate || 0) ? current : top
      , null)
    }

    // Get time-series data for trends (last 7 days)
    const trendData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dailyCandidates = await prisma.candidate.count({
        where: {
          addedById: { in: teamUserIds },
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      })

      const dailyApplications = await prisma.application.count({
        where: {
          submittedById: { in: teamUserIds },
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      })

      trendData.push({
        date: date.toISOString().split('T')[0],
        candidates: dailyCandidates,
        applications: dailyApplications
      })
    }

    return NextResponse.json({
      metrics: teamMetrics,
      performance: performanceData,
      activity: recentActivity,
      trends: trendData,
      timeRange: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching admin performance data:', error)
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000)
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    return new Date(date).toLocaleDateString()
  }
}