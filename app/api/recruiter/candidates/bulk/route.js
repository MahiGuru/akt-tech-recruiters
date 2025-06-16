// app/api/recruiter/candidates/bulk/route.js (New Bulk Operations API)
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../(client)/lib/auth'
import { prisma } from '../../../../(client)/lib/prisma'

// Helper function to get team member IDs for admin
async function getTeamMemberIds(adminUserId) {
  const teamMembers = await prisma.recruiter.findMany({
    where: {
      OR: [
        { adminId: adminUserId }, // Team members
        { userId: adminUserId, recruiterType: 'ADMIN' } // Current admin
      ],
      isActive: true
    },
    select: { userId: true }
  })
  return teamMembers.map(member => member.userId)
}

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

    // Only admins can perform bulk operations
    if (recruiterProfile.recruiterType !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required for bulk operations' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { operations } = body

    if (!operations || !Array.isArray(operations)) {
      return NextResponse.json(
        { message: 'Operations array is required' },
        { status: 400 }
      )
    }

    const allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    const results = []
    let successCount = 0
    let errorCount = 0

    // Process each operation
    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'update_status':
            await updateCandidateStatus(operation.candidateId, operation.status, allowedRecruiterIds, session.user.id)
            results.push({
              type: 'update_status',
              candidateId: operation.candidateId,
              status: operation.status,
              success: true
            })
            successCount++
            break

          case 'transfer_ownership':
            await transferCandidateOwnership(operation.candidateId, operation.newOwnerId, allowedRecruiterIds, session.user.id)
            results.push({
              type: 'transfer_ownership',
              candidateId: operation.candidateId,
              newOwnerId: operation.newOwnerId,
              success: true
            })
            successCount++
            break

          case 'bulk_delete':
            await deleteCandidates(operation.candidateIds, allowedRecruiterIds, session.user.id)
            results.push({
              type: 'bulk_delete',
              candidateIds: operation.candidateIds,
              success: true
            })
            successCount++
            break

          case 'schedule_interview':
            await scheduleInterviewForCandidate(operation.candidateId, operation.interviewData, allowedRecruiterIds, session.user.id)
            results.push({
              type: 'schedule_interview',
              candidateId: operation.candidateId,
              success: true
            })
            successCount++
            break

          case 'send_bulk_email':
            await sendBulkEmail(operation.candidateIds, operation.emailData, allowedRecruiterIds, session.user.id)
            results.push({
              type: 'send_bulk_email',
              candidateIds: operation.candidateIds,
              success: true
            })
            successCount++
            break

          default:
            throw new Error(`Unknown operation type: ${operation.type}`)
        }
      } catch (error) {
        console.error(`Bulk operation error:`, error)
        results.push({
          ...operation,
          success: false,
          error: error.message
        })
        errorCount++
      }
    }

    // Create summary notification
    await prisma.notification.create({
      data: {
        title: 'Bulk Operations Completed',
        message: `Completed ${successCount} successful operations, ${errorCount} errors`,
        type: successCount > 0 ? 'SUCCESS' : 'WARNING',
        receiverId: session.user.id
      }
    })

    return NextResponse.json({
      message: 'Bulk operations completed',
      summary: {
        total: operations.length,
        successful: successCount,
        errors: errorCount
      },
      results
    })

  } catch (error) {
    console.error('Bulk operations error:', error)
    return NextResponse.json(
      { message: 'Bulk operations failed' },
      { status: 500 }
    )
  }
}

// Helper functions for bulk operations

async function updateCandidateStatus(candidateId, status, allowedRecruiterIds, adminId) {
  // Verify candidate access
  const candidate = await prisma.candidate.findFirst({
    where: {
      id: candidateId,
      addedById: { in: allowedRecruiterIds }
    },
    include: {
      addedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  if (!candidate) {
    throw new Error('Candidate not found or access denied')
  }

  // Validate status
  const validStatuses = ['ACTIVE', 'PLACED', 'INACTIVE', 'DO_NOT_CONTACT']
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status')
  }

  // Update candidate status
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { status }
  })

  // Notify original recruiter if different from admin
  if (candidate.addedById !== adminId) {
    await prisma.notification.create({
      data: {
        title: 'Candidate Status Updated by Admin',
        message: `Admin updated ${candidate.name}'s status to ${status}`,
        type: 'INFO',
        receiverId: candidate.addedById,
        senderId: adminId
      }
    })
  }
}

async function transferCandidateOwnership(candidateId, newOwnerId, allowedRecruiterIds, adminId) {
  // Verify candidate access
  const candidate = await prisma.candidate.findFirst({
    where: {
      id: candidateId,
      addedById: { in: allowedRecruiterIds }
    },
    include: {
      addedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  if (!candidate) {
    throw new Error('Candidate not found or access denied')
  }

  // Verify new owner is in team
  if (!allowedRecruiterIds.includes(newOwnerId)) {
    throw new Error('New owner is not a team member')
  }

  const oldOwnerId = candidate.addedById

  // Transfer ownership
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { addedById: newOwnerId }
  })

  // Get new owner info
  const newOwner = await prisma.user.findUnique({
    where: { id: newOwnerId },
    select: { name: true }
  })

  // Notify old owner
  if (oldOwnerId !== adminId) {
    await prisma.notification.create({
      data: {
        title: 'Candidate Transferred by Admin',
        message: `Admin transferred ${candidate.name} to ${newOwner?.name}`,
        type: 'INFO',
        receiverId: oldOwnerId,
        senderId: adminId
      }
    })
  }

  // Notify new owner
  if (newOwnerId !== adminId) {
    await prisma.notification.create({
      data: {
        title: 'New Candidate Assigned',
        message: `Admin assigned candidate ${candidate.name} to you`,
        type: 'INFO',
        receiverId: newOwnerId,
        senderId: adminId
      }
    })
  }
}

async function deleteCandidates(candidateIds, allowedRecruiterIds, adminId) {
  // Verify all candidates are accessible
  const candidates = await prisma.candidate.findMany({
    where: {
      id: { in: candidateIds },
      addedById: { in: allowedRecruiterIds }
    },
    include: {
      addedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  if (candidates.length !== candidateIds.length) {
    throw new Error('Some candidates not found or access denied')
  }

  // Group by original recruiter for notifications
  const recruiterCandidates = candidates.reduce((acc, candidate) => {
    if (!acc[candidate.addedById]) {
      acc[candidate.addedById] = []
    }
    acc[candidate.addedById].push(candidate.name)
    return acc
  }, {})

  // Delete candidates (will cascade delete related records)
  await prisma.candidate.deleteMany({
    where: {
      id: { in: candidateIds }
    }
  })

  // Notify recruiters whose candidates were deleted
  for (const [recruiterId, candidateNames] of Object.entries(recruiterCandidates)) {
    if (recruiterId !== adminId) {
      await prisma.notification.create({
        data: {
          title: 'Candidates Deleted by Admin',
          message: `Admin deleted ${candidateNames.length} candidate(s): ${candidateNames.join(', ')}`,
          type: 'WARNING',
          receiverId: recruiterId,
          senderId: adminId
        }
      })
    }
  }
}

async function scheduleInterviewForCandidate(candidateId, interviewData, allowedRecruiterIds, adminId) {
  // Verify candidate access
  const candidate = await prisma.candidate.findFirst({
    where: {
      id: candidateId,
      addedById: { in: allowedRecruiterIds }
    }
  })

  if (!candidate) {
    throw new Error('Candidate not found or access denied')
  }

  // Validate interview data
  const { title, scheduledAt, duration = 60, scheduledById } = interviewData

  if (!title || !scheduledAt) {
    throw new Error('Interview title and scheduled time are required')
  }

  // Determine who is scheduling
  const actualScheduledById = scheduledById && allowedRecruiterIds.includes(scheduledById) ? scheduledById : adminId

  // Validate interview time is in the future
  const interviewTime = new Date(scheduledAt)
  if (interviewTime <= new Date()) {
    throw new Error('Interview must be scheduled for a future time')
  }

  // Check for overlapping interviews
  const overlappingInterview = await prisma.interview.findFirst({
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

  if (overlappingInterview) {
    throw new Error(`Candidate already has an overlapping interview scheduled`)
  }

  // Create interview
  await prisma.interview.create({
    data: {
      candidateId,
      scheduledById: actualScheduledById,
      title,
      scheduledAt: interviewTime,
      duration,
      description: interviewData.description || null,
      meetingLink: interviewData.meetingLink || null,
      notes: interviewData.notes || null
    }
  })

  // Notify candidate owner if different from scheduler
  if (candidate.addedById !== actualScheduledById) {
    await prisma.notification.create({
      data: {
        title: 'Interview Scheduled by Admin',
        message: `Admin scheduled interview "${title}" for your candidate ${candidate.name}`,
        type: 'INFO',
        receiverId: candidate.addedById,
        senderId: adminId
      }
    })
  }
}

async function sendBulkEmail(candidateIds, emailData, allowedRecruiterIds, adminId) {
  // Verify candidates are accessible
  const candidates = await prisma.candidate.findMany({
    where: {
      id: { in: candidateIds },
      addedById: { in: allowedRecruiterIds }
    },
    select: {
      id: true,
      name: true,
      email: true,
      addedById: true
    }
  })

  if (candidates.length === 0) {
    throw new Error('No accessible candidates found')
  }

  // Validate email data
  const { subject, content, template } = emailData

  if (!subject || !content) {
    throw new Error('Email subject and content are required')
  }

  // Here you would integrate with your email service
  // For now, we'll just create notifications
  const emailPromises = candidates.map(candidate => {
    // Create notification for tracking
    return prisma.notification.create({
      data: {
        title: 'Bulk Email Sent',
        message: `Email "${subject}" sent to ${candidate.name} (${candidate.email})`,
        type: 'INFO',
        receiverId: adminId
      }
    })
  })

  await Promise.all(emailPromises)

  // Group candidates by recruiter for summary notifications
  const recruiterCandidates = candidates.reduce((acc, candidate) => {
    if (!acc[candidate.addedById]) {
      acc[candidate.addedById] = []
    }
    acc[candidate.addedById].push(candidate.name)
    return acc
  }, {})

  // Notify recruiters about emails sent to their candidates
  for (const [recruiterId, candidateNames] of Object.entries(recruiterCandidates)) {
    if (recruiterId !== adminId) {
      await prisma.notification.create({
        data: {
          title: 'Bulk Email Sent to Your Candidates',
          message: `Admin sent email "${subject}" to ${candidateNames.length} of your candidates: ${candidateNames.join(', ')}`,
          type: 'INFO',
          receiverId: recruiterId,
          senderId: adminId
        }
      })
    }
  }
}