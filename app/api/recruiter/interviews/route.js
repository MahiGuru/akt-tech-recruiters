// app/api/recruiter/interviews/route.js - Updated with Feedback Support
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../(client)/lib/auth'
import { prisma } from '../../../(client)/lib/prisma'

// Helper function to get team member IDs for admin
async function getTeamMemberIds(adminUserId) {
  const visited = new Set()
  const toVisit = [adminId]

  while (toVisit.length > 0) {
    const currentAdminId = toVisit.pop()

    if (!visited.has(currentAdminId)) {
      visited.add(currentAdminId)

      const team = await prisma.recruiter.findMany({
        where: { adminId: currentAdminId, isActive: true },
        select: { userId: true }
      })

      team.forEach(member => {
        if (!visited.has(member.userId)) {
          toVisit.push(member.userId)
        }
      })
    }
  }

  return Array.from(visited)
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get recruiter profile
    const recruiterProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id }
    })

    if (!recruiterProfile || !recruiterProfile.isActive) {
      return NextResponse.json(
        { message: 'Recruiter profile not found or inactive' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')
    const status = searchParams.get('status')
    const scheduledBy = searchParams.get('scheduledBy') // Filter by recruiter who scheduled
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const hasFeedback = searchParams.get('hasFeedback') // Filter by feedback status
    const outcome = searchParams.get('outcome') // Filter by feedback outcome
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Determine access scope based on admin status
    const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
    let allowedRecruiterIds = [session.user.id]

    if (isAdmin) {
      allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    }

    // Build where clause - interviews scheduled by accessible recruiters OR for candidates added by accessible recruiters
    let whereClause = {
      OR: [
        { scheduledById: { in: allowedRecruiterIds } }, // Interviews scheduled by team
        { 
          candidate: {
            addedById: { in: allowedRecruiterIds }
          }
        } // Interviews for team candidates
      ]
    }

    if (candidateId) {
      // Verify candidate access first
      const candidate = await prisma.candidate.findFirst({
        where: {
          id: candidateId,
          addedById: { in: allowedRecruiterIds }
        }
      })

      if (!candidate) {
        return NextResponse.json(
          { message: 'Candidate not found or access denied' },
          { status: 403 }
        )
      }

      whereClause.candidateId = candidateId
    }

    // Filter by specific recruiter (admin only)
    if (scheduledBy && isAdmin && allowedRecruiterIds.includes(scheduledBy)) {
      whereClause = {
        scheduledById: scheduledBy,
        ...(candidateId && { candidateId })
      }
    }

    // Handle comma-separated status values
    if (status) {
      const statusValues = status.split(',').map(s => s.trim())
      if (statusValues.length === 1) {
        whereClause.status = statusValues[0]
      } else {
        whereClause.status = {
          in: statusValues
        }
      }
    }

    if (fromDate || toDate) {
      whereClause.scheduledAt = {}
      if (fromDate) {
        whereClause.scheduledAt.gte = new Date(fromDate)
      }
      if (toDate) {
        whereClause.scheduledAt.lte = new Date(toDate)
      }
    }

    // NEW: Filter by feedback status
    if (hasFeedback !== null) {
      if (hasFeedback === 'true') {
        whereClause.feedbackSubmitted = true
      } else if (hasFeedback === 'false') {
        whereClause.feedbackSubmitted = false
      }
    }

    // NEW: Filter by feedback outcome
    if (outcome) {
      whereClause.outcome = outcome
      whereClause.feedbackSubmitted = true // Only show interviews with feedback
    }

    // Fetch interviews with full details including feedback
    const interviews = await prisma.interview.findMany({
      where: whereClause,
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            skills: true,
            experience: true,
            addedById: true,
            addedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        scheduledBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        // NEW: Include feedback submitter details
        feedbackSubmitter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
      skip: offset
    })

    // Add permissions to each interview
    const interviewsWithPermissions = interviews.map(interview => ({
      ...interview,
      canEdit: isAdmin || interview.scheduledById === session.user.id,
      canDelete: isAdmin || interview.scheduledById === session.user.id,
      canReschedule: isAdmin || interview.scheduledById === session.user.id,
      // NEW: Feedback permissions
      canSubmitFeedback: (isAdmin || interview.scheduledById === session.user.id || interview.candidate.addedById === session.user.id) && 
                        !interview.feedbackSubmitted && 
                        new Date(interview.scheduledAt.getTime() + (interview.duration * 60 * 1000)) <= new Date(),
      canViewFeedback: interview.feedbackSubmitted && 
                      (isAdmin || interview.scheduledById === session.user.id || interview.candidate.addedById === session.user.id || interview.feedbackSubmittedById === session.user.id)
    }))

    // Get total count
    const totalCount = await prisma.interview.count({
      where: whereClause
    })

    // Get status distribution for stats
    const statusStats = await prisma.interview.groupBy({
      by: ['status'],
      where: {
        OR: [
          { scheduledById: { in: allowedRecruiterIds } },
          { 
            candidate: {
              addedById: { in: allowedRecruiterIds }
            }
          }
        ]
      },
      _count: { status: true }
    })

    // NEW: Get feedback statistics
    const feedbackStats = await prisma.interview.groupBy({
      by: ['outcome'],
      where: {
        OR: [
          { scheduledById: { in: allowedRecruiterIds } },
          { 
            candidate: {
              addedById: { in: allowedRecruiterIds }
            }
          }
        ],
        feedbackSubmitted: true
      },
      _count: { outcome: true }
    })

    // Get upcoming interviews (next 7 days)
    const upcomingInterviews = await prisma.interview.count({
      where: {
        OR: [
          { scheduledById: { in: allowedRecruiterIds } },
          { 
            candidate: {
              addedById: { in: allowedRecruiterIds }
            }
          }
        ],
        scheduledAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    })

    // NEW: Get interviews needing feedback (past interviews without feedback)
    const needingFeedback = await prisma.interview.count({
      where: {
        OR: [
          { scheduledById: { in: allowedRecruiterIds } },
          { 
            candidate: {
              addedById: { in: allowedRecruiterIds }
            }
          }
        ],
        scheduledAt: {
          lt: new Date()
        },
        feedbackSubmitted: false,
        status: {
          not: 'CANCELLED'
        }
      }
    })

    // Get recruiter distribution (for admin view)
    let recruiterStats = []
    if (isAdmin) {
      const recruiterInterviewStats = await prisma.interview.groupBy({
        by: ['scheduledById'],
        where: {
          scheduledById: { in: allowedRecruiterIds }
        },
        _count: { scheduledById: true }
      })

      recruiterStats = await Promise.all(
        recruiterInterviewStats.map(async (stat) => {
          const user = await prisma.user.findUnique({
            where: { id: stat.scheduledById },
            select: { name: true, email: true }
          })
          return {
            recruiterId: stat.scheduledById,
            recruiterName: user?.name || 'Unknown',
            recruiterEmail: user?.email || '',
            interviewCount: stat._count.scheduledById
          }
        })
      )
    }

    return NextResponse.json({
      interviews: interviewsWithPermissions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats: {
        total: totalCount,
        upcoming: upcomingInterviews,
        needingFeedback, // NEW
        statusDistribution: statusStats.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        // NEW: Feedback outcome distribution
        feedbackDistribution: feedbackStats.map(item => ({
          outcome: item.outcome,
          count: item._count.outcome
        })),
        recruiterDistribution: recruiterStats
      },
      permissions: {
        isAdmin,
        canManageAll: isAdmin
      }
    })

  } catch (error) {
    console.error('Error fetching interviews:', error)
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST method remains the same as before
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get recruiter profile
    const recruiterProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id }
    })

    if (!recruiterProfile || !recruiterProfile.isActive) {
      return NextResponse.json(
        { message: 'Recruiter profile not found or inactive' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      candidateId, 
      title, 
      description, 
      scheduledAt, 
      duration = 60, 
      meetingLink, 
      notes,
      scheduledById // Allow admin to schedule for other recruiters
    } = body

    if (!candidateId || !title || !scheduledAt) {
      return NextResponse.json(
        { message: 'Candidate ID, title, and scheduled time are required' },
        { status: 400 }
      )
    }

    // Determine access scope
    const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
    let allowedRecruiterIds = [session.user.id]

    if (isAdmin) {
      allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    }

    // Verify candidate belongs to accessible recruiters
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        addedById: { in: allowedRecruiterIds }
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { message: 'Candidate not found or access denied' },
        { status: 404 }
      )
    }

    // Determine who is scheduling (admin can schedule for others)
    let actualScheduledById = session.user.id
    if (scheduledById && isAdmin && allowedRecruiterIds.includes(scheduledById)) {
      actualScheduledById = scheduledById
    }

    // Validate interview time is in the future
    const interviewTime = new Date(scheduledAt)
    if (interviewTime <= new Date()) {
      return NextResponse.json(
        { message: 'Interview must be scheduled for a future time' },
        { status: 400 }
      )
    }

    // Check for candidate's overlapping interviews
    const candidateOverlappingInterview = await prisma.interview.findFirst({
      where: {
        candidateId: candidateId,
        scheduledAt: {
          gte: new Date(interviewTime.getTime() - (duration * 60 * 1000) + 1),
          lt: new Date(interviewTime.getTime() + (duration * 60 * 1000) - 1)
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    })

    if (candidateOverlappingInterview) {
      return NextResponse.json(
        { message: `This candidate already has an overlapping interview scheduled for this time. Please choose another slot for ${candidate.name}.` },
        { status: 400 }
      )
    }

    // Check for recruiter's overlapping interviews
    // const recruiterOverlappingInterview = await prisma.interview.findFirst({
    //   where: {
    //     scheduledById: actualScheduledById,
    //     scheduledAt: {
    //       gte: new Date(interviewTime.getTime() - (duration * 60 * 1000) + 1),
    //       lt: new Date(interviewTime.getTime() + (duration * 60 * 1000) - 1)
    //     },
    //     status: {
    //       in: ['SCHEDULED', 'CONFIRMED']
    //     }
    //   }
    // })

    // if (recruiterOverlappingInterview) {
    //   const recruiterName = actualScheduledById === session.user.id ? 'you' : 'the selected recruiter'
    //   return NextResponse.json(
    //     { message: `${recruiterName.charAt(0).toUpperCase() + recruiterName.slice(1)} already have an overlapping interview scheduled for this time. Please choose another slot.` },
    //     { status: 400 }
    //   )
    // }

    // Create interview
    const interview = await prisma.interview.create({
      data: {
        candidateId,
        scheduledById: actualScheduledById,
        title,
        description: description || null,
        scheduledAt: interviewTime,
        duration,
        meetingLink: meetingLink || null,
        notes: notes || null
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            addedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        scheduledBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Schedule reminder notification (15 minutes before)
    const reminderTime = new Date(interviewTime.getTime() - (15 * 60 * 1000))
    
    if (reminderTime > new Date()) {
      await prisma.notification.create({
        data: {
          title: 'Interview Reminder',
          message: `Your interview with ${candidate.name} for "${title}" starts in 15 minutes.`,
          type: 'INTERVIEW_REMINDER',
          receiverId: actualScheduledById,
          interviewId: interview.id,
          scheduledFor: reminderTime
        }
      })
    }

    return NextResponse.json({
      message: 'Interview scheduled successfully',
      interview
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating interview:', error)
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT and DELETE methods remain the same as the original implementation
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get recruiter profile
    const recruiterProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id }
    })

    if (!recruiterProfile || !recruiterProfile.isActive) {
      return NextResponse.json(
        { message: 'Recruiter profile not found or inactive' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      interviewId, 
      title, 
      description, 
      scheduledAt, 
      duration, 
      meetingLink, 
      notes, 
      status 
    } = body

    if (!interviewId) {
      return NextResponse.json(
        { message: 'Interview ID is required' },
        { status: 400 }
      )
    }

    // Determine access scope
    const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
    let allowedRecruiterIds = [session.user.id]

    if (isAdmin) {
      allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    }

    // Verify interview access
    const existingInterview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        OR: [
          { scheduledById: { in: allowedRecruiterIds } }, // Scheduled by team
          { 
            candidate: {
              addedById: { in: allowedRecruiterIds }
            }
          } // For team candidates
        ]
      },
      include: {
        candidate: {
          select: { 
            name: true,
            addedById: true 
          }
        }
      }
    })

    if (!existingInterview) {
      return NextResponse.json(
        { message: 'Interview not found or access denied' },
        { status: 404 }
      )
    }

    // Check if user can edit this specific interview
    const canEdit = isAdmin || existingInterview.scheduledById === session.user.id

    if (!canEdit) {
      return NextResponse.json(
        { message: 'You do not have permission to edit this interview' },
        { status: 403 }
      )
    }

    // If rescheduling, validate new time and check for overlaps
    if (scheduledAt) {
      const newTime = new Date(scheduledAt)
      if (newTime <= new Date()) {
        return NextResponse.json(
          { message: 'Interview must be scheduled for a future time' },
          { status: 400 }
        )
      }

      const interviewDuration = duration || existingInterview.duration

      // // Check for recruiter's overlapping interviews (excluding the current one)
      // const recruiterOverlappingInterview = await prisma.interview.findFirst({
      //   where: {
      //     id: { not: interviewId },
      //     scheduledById: existingInterview.scheduledById,
      //     scheduledAt: {
      //       gte: new Date(newTime.getTime() - (interviewDuration * 60 * 1000) + 1),
      //       lt: new Date(newTime.getTime() + (interviewDuration * 60 * 1000) - 1)
      //     },
      //     status: {
      //       in: ['SCHEDULED', 'CONFIRMED']
      //     }
      //   }
      // })

      // if (recruiterOverlappingInterview) {
      //   return NextResponse.json(
      //     { message: 'The recruiter has an overlapping interview scheduled for this time. Please choose another slot.' },
      //     { status: 400 }
      //   )
      // }

      // Check for candidate's overlapping interviews (excluding the current one)
      const candidateOverlappingInterview = await prisma.interview.findFirst({
        where: {
          id: { not: interviewId },
          candidateId: existingInterview.candidateId,
          scheduledAt: {
            gte: new Date(newTime.getTime() - (interviewDuration * 60 * 1000) + 1),
            lt: new Date(newTime.getTime() + (interviewDuration * 60 * 1000) - 1)
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED']
          }
        }
      })

      if (candidateOverlappingInterview) {
        return NextResponse.json(
          { message: `This candidate already has an overlapping interview scheduled for this time. Please choose another slot for ${existingInterview.candidate.name}.` },
          { status: 400 }
        )
      }
    }

    // Update interview
    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(duration && { duration }),
        ...(meetingLink !== undefined && { meetingLink }),
        ...(notes !== undefined && { notes }),
        ...(status && { status })
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            addedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        scheduledBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        // NEW: Include feedback submitter if exists
        feedbackSubmitter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // If rescheduled, update reminder notification
    if (scheduledAt) {
      const newTime = new Date(scheduledAt)
      const reminderTime = new Date(newTime.getTime() - (15 * 60 * 1000))
      
      // Remove old reminder
      await prisma.notification.deleteMany({
        where: {
          interviewId: interviewId,
          type: 'INTERVIEW_REMINDER'
        }
      })
      
      // Create new reminder if in future
      if (reminderTime > new Date()) {
        await prisma.notification.create({
          data: {
            title: 'Interview Reminder (Rescheduled)',
            message: `Your rescheduled interview with ${existingInterview.candidate.name} for "${updatedInterview.title}" starts in 15 minutes.`,
            type: 'INTERVIEW_REMINDER',
            receiverId: existingInterview.scheduledById,
            interviewId: interviewId,
            scheduledFor: reminderTime
          }
        })
      }
    }

    return NextResponse.json({
      message: 'Interview updated successfully',
      interview: updatedInterview
    })

  } catch (error) {
    console.error('Error updating interview:', error)
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get recruiter profile
    const recruiterProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id }
    })

    if (!recruiterProfile || !recruiterProfile.isActive) {
      return NextResponse.json(
        { message: 'Recruiter profile not found or inactive' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get('interviewId')

    if (!interviewId) {
      return NextResponse.json(
        { message: 'Interview ID is required' },
        { status: 400 }
      )
    }

    // Determine access scope
    const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
    let allowedRecruiterIds = [session.user.id]

    if (isAdmin) {
      allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    }

    // Verify interview access
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        OR: [
          { scheduledById: { in: allowedRecruiterIds } },
          { 
            candidate: {
              addedById: { in: allowedRecruiterIds }
            }
          }
        ]
      }
    })

    if (!interview) {
      return NextResponse.json(
        { message: 'Interview not found or access denied' },
        { status: 404 }
      )
    }

    // Check if user can delete this specific interview
    const canDelete = isAdmin || interview.scheduledById === session.user.id

    if (!canDelete) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this interview' },
        { status: 403 }
      )
    }

    // Delete associated notifications
    await prisma.notification.deleteMany({
      where: {
        interviewId: interviewId
      }
    })

    // Delete interview
    await prisma.interview.delete({
      where: { id: interviewId }
    })

    return NextResponse.json({
      message: 'Interview cancelled successfully'
    })

  } catch (error) {
    console.error('Error deleting interview:', error)
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}