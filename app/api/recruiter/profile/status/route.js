// app/api/recruiter/profile/status/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../(client)/lib/auth'
import { prisma } from '../../../../(client)/lib/prisma'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Not a recruiter role' },
        { status: 403 }
      )
    }

    // Check if user has a recruiter profile
    const recruiterProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id },
      include: {
        adminRecruiter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!recruiterProfile) {
      return NextResponse.json({
        hasProfile: false,
        isActive: false,
        hasPendingRequest: false,
        needsApproval: true
      })
    }

    return NextResponse.json({
      hasProfile: true,
      isActive: recruiterProfile.isActive,
      hasPendingRequest: !recruiterProfile.isActive,
      needsApproval: !recruiterProfile.isActive,
      profile: {
        id: recruiterProfile.id,
        recruiterType: recruiterProfile.recruiterType,
        department: recruiterProfile.department,
        adminId: recruiterProfile.adminId,
        admin: recruiterProfile.adminRecruiter,
        createdAt: recruiterProfile.createdAt
      }
    })

  } catch (error) {
    console.error('Error checking recruiter profile status:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}