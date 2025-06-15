// app/api/recruiter/team/approve/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../(client)/lib/auth'
import { prisma } from '../../../../(client)/lib/prisma'

export async function POST(request) {
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
        { message: 'Admin access required to approve requests' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { requestId, action } = body

    if (!requestId || !action) {
      return NextResponse.json(
        { message: 'Request ID and action are required' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Find the recruiter request
    const recruiterRequest = await prisma.recruiter.findUnique({
      where: { id: requestId },
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

    if (!recruiterRequest) {
      return NextResponse.json(
        { message: 'Request not found' },
        { status: 404 }
      )
    }

    // Check if request is already processed
    if (recruiterRequest.isActive) {
      return NextResponse.json(
        { message: 'Request has already been approved' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Approve the request
      const updatedRecruiter = await prisma.recruiter.update({
        where: { id: requestId },
        data: {
          isActive: true,
          adminId: session.user.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              image: true,
              createdAt: true
            }
          }
        }
      })

      // Create notification for approved recruiter
      await prisma.notification.create({
        data: {
          title: 'Access Approved!',
          message: `Your recruiter access has been approved by ${session.user.name}. You can now access the recruiting dashboard.`,
          type: 'SUCCESS',
          receiverId: recruiterRequest.user.id,
          senderId: session.user.id
        }
      })

      // Create notification for admin
      await prisma.notification.create({
        data: {
          title: 'Recruiter Approved',
          message: `You have approved ${recruiterRequest.user.name} as a team member.`,
          type: 'SUCCESS',
          receiverId: session.user.id
        }
      })

      return NextResponse.json({
        message: 'Request approved successfully',
        recruiter: updatedRecruiter
      })

    } else {
      // Reject the request - delete the recruiter profile and user
      await prisma.$transaction(async (tx) => {
        // Delete recruiter profile
        await tx.recruiter.delete({
          where: { id: requestId }
        })

        // Delete user account
        await tx.user.delete({
          where: { id: recruiterRequest.user.id }
        })
      })

      // Create notification for admin
      await prisma.notification.create({
        data: {
          title: 'Request Rejected',
          message: `You have rejected the access request from ${recruiterRequest.user.name}. Their account has been removed.`,
          type: 'INFO',
          receiverId: session.user.id
        }
      })

      return NextResponse.json({
        message: 'Request rejected and account removed successfully'
      })
    }

  } catch (error) {
    console.error('Error processing approval request:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}