// app/api/recruiter/interviews/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../(client)/lib/auth'
import { prisma } from '../../../(client)/lib/prisma'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')
    const status = searchParams.get('status')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    let whereClause = {
      scheduledById: session.user.id // Only interviews scheduled by this recruiter
    }

    if (candidateId) {
      whereClause.candidateId = candidateId
    }

    // FIXED: Handle comma-separated status values
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

    // Fetch interviews
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
            experience: true
          }
        },
        scheduledBy: {
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

    // Get total count
    const totalCount = await prisma.interview.count({
      where: whereClause
    })

    // Get status distribution for stats
    const statusStats = await prisma.interview.groupBy({
      by: ['status'],
      where: { scheduledById: session.user.id },
      _count: { status: true }
    })

    // Get upcoming interviews (next 7 days)
    const upcomingInterviews = await prisma.interview.count({
      where: {
        scheduledById: session.user.id,
        scheduledAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    })

    return NextResponse.json({
      interviews,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats: {
        total: totalCount,
        upcoming: upcomingInterviews,
        statusDistribution: statusStats.map(item => ({
          status: item.status,
          count: item._count.status
        }))
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

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
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
      notes 
    } = body

    if (!candidateId || !title || !scheduledAt) {
      return NextResponse.json(
        { message: 'Candidate ID, title, and scheduled time are required' },
        { status: 400 }
      )
    }

    // Verify candidate belongs to this recruiter
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        addedById: session.user.id
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { message: 'Candidate not found or access denied' },
        { status: 404 }
      )
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

    // Create interview
    const interview = await prisma.interview.create({
      data: {
        candidateId,
        scheduledById: session.user.id,
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
            phone: true
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
          receiverId: session.user.id,
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

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
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

    // Verify interview belongs to this recruiter
    const existingInterview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        scheduledById: session.user.id
      },
      include: {
        candidate: {
          select: { name: true }
        }
      }
    })

    if (!existingInterview) {
      return NextResponse.json(
        { message: 'Interview not found or access denied' },
        { status: 404 }
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

      // Check for recruiter's overlapping interviews (excluding the current one)
      const recruiterOverlappingInterview = await prisma.interview.findFirst({
        where: {
          id: { not: interviewId },
          scheduledById: session.user.id,
          scheduledAt: {
            gte: new Date(newTime.getTime() - (duration * 60 * 1000) + 1),
            lt: new Date(newTime.getTime() + (duration * 60 * 1000) - 1)
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED']
          }
        }
      })

      if (recruiterOverlappingInterview) {
        return NextResponse.json(
          { message: 'You have an overlapping interview scheduled for this time. Please choose another slot for yourself.' },
          { status: 400 }
        )
      }

      // Check for candidate's overlapping interviews (excluding the current one)
      const candidateOverlappingInterview = await prisma.interview.findFirst({
        where: {
          id: { not: interviewId },
          candidateId: existingInterview.candidateId,
          scheduledAt: {
            gte: new Date(newTime.getTime() - (duration * 60 * 1000) + 1),
            lt: new Date(newTime.getTime() + (duration * 60 * 1000) - 1)
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
            phone: true
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
            receiverId: session.user.id,
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

    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get('interviewId')

    if (!interviewId) {
      return NextResponse.json(
        { message: 'Interview ID is required' },
        { status: 400 }
      )
    }

    // Verify interview belongs to this recruiter
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        scheduledById: session.user.id
      }
    })

    if (!interview) {
      return NextResponse.json(
        { message: 'Interview not found or access denied' },
        { status: 404 }
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