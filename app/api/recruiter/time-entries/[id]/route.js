// app/api/recruiter/time-entries/[id]/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../(client)/lib/auth'
import { prisma } from '../../../../(client)/lib/prisma'

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { date, hours, description, project } = body

    // Find the time entry
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { message: 'Time entry not found' },
        { status: 404 }
      )
    }

    // Check if user owns this entry
    if (existingEntry.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'You can only edit your own time entries' },
        { status: 403 }
      )
    }

    // Check if entry can be edited (only DRAFT or REJECTED entries)
    if (!['DRAFT', 'REJECTED'].includes(existingEntry.status)) {
      return NextResponse.json(
        { message: 'Cannot edit approved or pending entries' },
        { status: 400 }
      )
    }

    if (!date || !hours) {
      return NextResponse.json(
        { message: 'Date and hours are required' },
        { status: 400 }
      )
    }

    const hoursFloat = parseFloat(hours)
    if (isNaN(hoursFloat) || hoursFloat <= 0 || hoursFloat > 24) {
      return NextResponse.json(
        { message: 'Hours must be a valid number between 0 and 24' },
        { status: 400 }
      )
    }

    // Update time entry
    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        date: new Date(date),
        hours: hoursFloat,
        description: description || null,
        project: project || null,
        status: 'PENDING' // Re-submit for approval
      },
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

    // Send notification to manager
    const recruiterProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id }
    })

    if (recruiterProfile?.adminId) {
      await prisma.notification.create({
        data: {
          title: 'Updated Time Entry for Approval',
          message: `${session.user.name} updated and resubmitted ${hoursFloat} hours for ${new Date(date).toLocaleDateString()}`,
          type: 'APPROVAL_REQUEST',
          receiverId: recruiterProfile.adminId,
          senderId: session.user.id
        }
      })
    }

    return NextResponse.json({
      message: 'Time entry updated successfully',
      entry: updatedEntry
    })

  } catch (error) {
    console.error('Error updating time entry:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Find the time entry
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { message: 'Time entry not found' },
        { status: 404 }
      )
    }

    // Check if user owns this entry
    if (existingEntry.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'You can only delete your own time entries' },
        { status: 403 }
      )
    }

    // Check if entry can be deleted (not APPROVED)
    if (existingEntry.status === 'APPROVED') {
      return NextResponse.json(
        { message: 'Cannot delete approved entries' },
        { status: 400 }
      )
    }

    // Delete time entry
    await prisma.timeEntry.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Time entry deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}