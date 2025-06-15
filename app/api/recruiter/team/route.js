import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../(client)/lib/auth'
import { prisma } from '../../../(client)/lib/prisma'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a recruiter
    if (session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Access denied. Recruiter role required.' },
        { status: 403 }
      )
    }

    // Get recruiter profile to check if admin
    const recruiterProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    })

    if (!recruiterProfile || !recruiterProfile.isActive) {
      return NextResponse.json(
        { message: 'Recruiter profile not found or inactive' },
        { status: 403 }
      )
    }

    // Only admin recruiters can view team
    if (recruiterProfile.recruiterType !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required to view team members' },
        { status: 403 }
      )
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const recruiterType = searchParams.get('recruiterType')
    const department = searchParams.get('department')

    // Build where clause
    let whereClause = {
      OR: [
        { adminId: session.user.id }, // Team members
        { userId: session.user.id, recruiterType: 'ADMIN' } // Current admin
      ]
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    if (recruiterType) {
      whereClause.recruiterType = recruiterType
    }

    if (department) {
      whereClause.department = { contains: department, mode: 'insensitive' }
    }

    // Fetch team members
    const teamMembers = await prisma.recruiter.findMany({
      where: whereClause,
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
        },
        adminRecruiter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { recruiterType: 'asc' },
        { user: { name: 'asc' } }
      ]
    })

    // Get team statistics
    const stats = await prisma.recruiter.aggregate({
      where: whereClause,
      _count: {
        id: true
      }
    })

    const activeCount = await prisma.recruiter.count({
      where: {
        ...whereClause,
        isActive: true
      }
    })

    const typeDistribution = await prisma.recruiter.groupBy({
      by: ['recruiterType'],
      where: whereClause,
      _count: {
        recruiterType: true
      }
    })

    return NextResponse.json({
      teamMembers,
      stats: {
        total: stats._count.id,
        active: activeCount,
        inactive: stats._count.id - activeCount,
        typeDistribution: typeDistribution.map(item => ({
          type: item.recruiterType,
          count: item._count.recruiterType
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching team members:', error)
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

    // Check if user is admin recruiter
    const adminProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id }
    })

    if (!adminProfile || adminProfile.recruiterType !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, recruiterType, department } = body

    if (!email || !recruiterType) {
      return NextResponse.json(
        { message: 'Email and recruiter type are required' },
        { status: 400 }
      )
    }

    // Check if user exists and has RECRUITER role
    const targetUser = await prisma.user.findUnique({
      where: { email },
      include: { recruiterProfile: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    if (targetUser.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'User must have RECRUITER role' },
        { status: 400 }
      )
    }

    if (!targetUser.recruiterProfile) {
      return NextResponse.json(
        { message: 'User does not have a recruiter profile' },
        { status: 400 }
      )
    }

    // Update recruiter profile
    const updatedRecruiter = await prisma.recruiter.update({
      where: { userId: targetUser.id },
      data: {
        recruiterType,
        department: department || null,
        adminId: session.user.id,
        isActive: true
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

    return NextResponse.json({
      message: 'Team member updated successfully',
      teamMember: updatedRecruiter
    })

  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
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

    // Check if user is admin recruiter
    const adminProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id }
    })

    if (!adminProfile || adminProfile.recruiterType !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { recruiterId, recruiterType, department, isActive } = body

    if (!recruiterId) {
      return NextResponse.json(
        { message: 'Recruiter ID is required' },
        { status: 400 }
      )
    }

    // Update recruiter
    const updatedRecruiter = await prisma.recruiter.update({
      where: { id: recruiterId },
      data: {
        ...(recruiterType && { recruiterType }),
        ...(department !== undefined && { department }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Team member updated successfully',
      teamMember: updatedRecruiter
    })

  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}