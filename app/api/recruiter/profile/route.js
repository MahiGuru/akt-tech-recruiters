// app/api/recruiter/profile/route.js
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

    // Get recruiter profile
    const recruiterProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
      return NextResponse.json(
        { message: 'Recruiter profile not found' },
        { status: 404 }
      )
    }

    // Calculate additional properties
    const isMainAdmin = recruiterProfile.recruiterType === 'ADMIN' && !recruiterProfile.adminId
    
    return NextResponse.json({
      ...recruiterProfile,
      isMainAdmin,
      permissions: {
        canCreateAdmins: isMainAdmin,
        canManageTeam: recruiterProfile.recruiterType === 'ADMIN',
        canViewHierarchy: recruiterProfile.recruiterType === 'ADMIN'
      }
    })

  } catch (error) {
    console.error('Error fetching recruiter profile:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}