// app/api/recruiter/team/request/route.js
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

    // Get list of admin recruiters for the user to choose from
    const adminRecruiters = await prisma.recruiter.findMany({
      where: {
        recruiterType: 'ADMIN',
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        user: { name: 'asc' }
      }
    })

    return NextResponse.json({
      admins: adminRecruiters
    })

  } catch (error) {
    console.error('Error fetching admin recruiters:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
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
    const { adminId, recruiterType, department, message } = body

    if (!recruiterType) {
      return NextResponse.json(
        { message: 'Recruiter type is required' },
        { status: 400 }
      )
    }

    // Validate recruiter type - allow ADMIN for self-assignment
    const validTypes = ['ADMIN', 'TA', 'HR', 'CS', 'LEAD', 'JUNIOR']
    if (!validTypes.includes(recruiterType)) {
      return NextResponse.json(
        { message: 'Invalid recruiter type' },
        { status: 400 }
      )
    }

    // Check if user already has a recruiter profile
    let recruiterProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id }
    })

    if (recruiterProfile && recruiterProfile.isActive) {
      return NextResponse.json(
        { message: 'You already have an active recruiter profile' },
        { status: 400 }
      )
    }

    // Special handling for admin role - no approval needed
    const isAdminRole = recruiterType === 'ADMIN'
    const needsApproval = !isAdminRole && adminId

    // If admin is specified and not becoming admin, verify they exist and are active
    if (adminId && !isAdminRole) {
      const adminRecruiter = await prisma.recruiter.findFirst({
        where: {
          userId: adminId,
          recruiterType: 'ADMIN',
          isActive: true
        }
      })

      if (!adminRecruiter) {
        return NextResponse.json(
          { message: 'Selected admin not found or inactive' },
          { status: 404 }
        )
      }
    }

    // Create or update recruiter profile with pending status (unless admin)
    if (recruiterProfile) {
      // Update existing inactive profile
      recruiterProfile = await prisma.recruiter.update({
        where: { id: recruiterProfile.id },
        data: {
          recruiterType,
          department: department || null,
          adminId: isAdminRole ? null : (adminId || null),
          isActive: isAdminRole // Admins are immediately active
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
    } else {
      // Create new recruiter profile
      recruiterProfile = await prisma.recruiter.create({
        data: {
          userId: session.user.id,
          recruiterType,
          department: department || null,
          adminId: isAdminRole ? null : (adminId || null),
          isActive: isAdminRole // Admins are immediately active
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
    }

    // Create notifications based on the scenario
    if (isAdminRole) {
      // Admin role - create welcome notification
      await prisma.notification.create({
        data: {
          title: 'Admin Access Granted',
          message: `Welcome! You have been granted admin access to the recruiting platform. You can now manage team members and access all features.`,
          type: 'SUCCESS',
          receiverId: session.user.id
        }
      })
    } else if (needsApproval && adminId) {
      // Needs approval - notify specific admin
      await prisma.notification.create({
        data: {
          title: 'New Team Access Request',
          message: `${session.user.name} has requested to join your recruiting team as a ${recruiterType}. ${message ? `Message: "${message}"` : ''}`,
          type: 'APPROVAL_REQUEST',
          receiverId: adminId,
          senderId: session.user.id
        }
      })

      // Create confirmation notification for the requester
      await prisma.notification.create({
        data: {
          title: 'Access Request Submitted',
          message: `Your request to join the recruiting team has been submitted. The admin will review your request and you will be notified once approved.`,
          type: 'INFO',
          receiverId: session.user.id
        }
      })
    } else {
      // No admin selected and not admin role - shouldn't happen with new UI, but handle gracefully
      // Make them admin
      await prisma.recruiter.update({
        where: { id: recruiterProfile.id },
        data: { 
          recruiterType: 'ADMIN',
          isActive: true,
          adminId: null
        }
      })

      await prisma.notification.create({
        data: {
          title: 'Admin Access Granted',
          message: `Since no admin was selected, you have been granted admin access to the recruiting platform.`,
          type: 'SUCCESS',
          receiverId: session.user.id
        }
      })
    }

    return NextResponse.json({
      message: isAdminRole 
        ? 'Admin access granted successfully' 
        : needsApproval 
          ? 'Access request submitted successfully'
          : 'Admin access granted successfully',
      request: recruiterProfile,
      isActive: recruiterProfile.isActive
    }, { status: 201 })

  } catch (error) {
    console.error('Error submitting access request:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}