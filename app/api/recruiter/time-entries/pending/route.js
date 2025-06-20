// app/api/recruiter/time-entries/pending/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../(client)/lib/auth'
import { prisma } from '../../../../(client)/lib/prisma'
import { getManagerTimeEntryUsers } from '../../../../(client)/lib/time-hierarchy-utils'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id }
    })

    if (!adminProfile || adminProfile.recruiterType !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get all users whose time entries this manager can approve
    const { directReports: directReportIds, escalatedUsers: escalatedUserIds } = await getManagerTimeEntryUsers(session.user.id)

    // Combine direct reports and escalated users
    const allApprovalUserIds = [...directReportIds, ...escalatedUserIds]

    console.log('Admin ID:', session.user.id)
    console.log('Direct Report IDs:', directReportIds)
    console.log('Escalated User IDs:', escalatedUserIds)
    console.log('All Approval User IDs:', allApprovalUserIds)

    // Get pending time entries from both direct reports and escalated users
    const pendingEntries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: allApprovalUserIds },
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            recruiterProfile: {
              select: {
                recruiterType: true,
                department: true,
                adminId: true
              }
            }
          }
        }
      },
      orderBy: { submittedAt: 'asc' } // Oldest first
    })

    console.log('Found pending entries:', pendingEntries.length)

    // Mark which entries are escalated
    const directReportEntries = pendingEntries.map(entry => ({
      ...entry,
      isEscalated: escalatedUserIds.includes(entry.userId),
      escalationReason: escalatedUserIds.includes(entry.userId) 
        ? 'Immediate manager unavailable' 
        : null
    }))

    // Get summary statistics
    const totalPendingHours = directReportEntries.reduce((sum, entry) => 
      sum + parseFloat(entry.hours), 0
    )

    const entriesByUser = directReportEntries.reduce((acc, entry) => {
      const userId = entry.user.id
      if (!acc[userId]) {
        acc[userId] = {
          user: entry.user,
          entries: [],
          totalHours: 0
        }
      }
      acc[userId].entries.push(entry)
      acc[userId].totalHours += parseFloat(entry.hours)
      return acc
    }, {})

    return NextResponse.json({
      entries: directReportEntries,
      summary: {
        totalEntries: directReportEntries.length,
        totalHours: totalPendingHours.toFixed(2),
        uniqueUsers: Object.keys(entriesByUser).length
      },
      entriesByUser: Object.values(entriesByUser)
    })

  } catch (error) {
    console.error('Error fetching pending approvals:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}