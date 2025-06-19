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

    const recruiterProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
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

    // Determine if this is a main admin (admin with no adminId)
    const isMainAdmin = recruiterProfile.recruiterType === 'ADMIN' && !recruiterProfile.adminId

    return NextResponse.json({
      id: recruiterProfile.id,
      userId: recruiterProfile.userId,
      recruiterType: recruiterProfile.recruiterType,
      department: recruiterProfile.department,
      isActive: recruiterProfile.isActive,
      isMainAdmin,
      user: recruiterProfile.user,
      adminRecruiter: recruiterProfile.adminRecruiter,
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