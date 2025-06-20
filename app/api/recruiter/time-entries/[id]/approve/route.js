// app/api/recruiter/time-entries/[id]/approve/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../(client)/lib/auth'
import { prisma } from '../../../../../(client)/lib/prisma'
import { canApproveTimeEntry } from '../../../../../(client)/lib/time-hierarchy-utils'

export async function PUT(request, { params }) {
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

    const { id } = params
    const body = await request.json()
    const { status, comments } = body

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { message: 'Status must be APPROVED or REJECTED' },
        { status: 400 }
      )
    }

    // Find the time entry with user profile
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            recruiterProfile: {
              select: {
                id: true,
                adminId: true,
                recruiterType: true
              }
            }
          }
        }
      }
    })

    if (!timeEntry) {
      return NextResponse.json(
        { message: 'Time entry not found' },
        { status: 404 }
      )
    }

    console.log('Time entry user ID:', timeEntry.userId)
    console.log('Current admin ID:', session.user.id)

    // Check if current user can approve this entry (direct or escalated)
    const approvalInfo = await canApproveTimeEntry(session.user.id, timeEntry.userId)

    if (!approvalInfo.canApprove) {
      return NextResponse.json(
        { 
          message: 'You can only approve entries from your direct reports or escalated entries',
          debug: {
            timeEntryUserId: timeEntry.userId,
            currentUserId: session.user.id,
            ...approvalInfo
          }
        },
        { status: 403 }
      )
    }

    // Check if entry is in pending status
    if (timeEntry.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Only pending entries can be approved or rejected' },
        { status: 400 }
      )
    }

    // Update time entry with approval/rejection
    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedById: session.user.id,
        reviewComments: comments || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Send notification to the employee
    const escalationNote = approvalInfo.isEscalated ? ' (Escalated approval)' : ''
    const notificationTitle = status === 'APPROVED' 
      ? `Time Entry Approved${escalationNote}` 
      : `Time Entry Rejected${escalationNote}`
    
    const notificationMessage = status === 'APPROVED'
      ? `Your time entry for ${new Date(timeEntry.date).toLocaleDateString()} (${timeEntry.hours}h) has been approved${approvalInfo.isEscalated ? ' by escalated manager' : ''}.`
      : `Your time entry for ${new Date(timeEntry.date).toLocaleDateString()} (${timeEntry.hours}h) has been rejected${approvalInfo.isEscalated ? ' by escalated manager' : ''}.${comments ? ` Reason: ${comments}` : ''}`

    await prisma.notification.create({
      data: {
        title: notificationTitle,
        message: notificationMessage,
        type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
        receiverId: timeEntry.userId,
        senderId: session.user.id
      }
    })

    return NextResponse.json({
      message: `Time entry ${status.toLowerCase()} successfully${approvalInfo.isEscalated ? ' (escalated)' : ''}`,
      entry: updatedEntry,
      escalated: approvalInfo.isEscalated
    })

  } catch (error) {
    console.error('Error approving/rejecting time entry:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}