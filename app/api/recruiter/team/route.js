// Updated app/api/recruiter/team/route.js - Fixed for sub-admin visibility
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

    // Determine if current user is main admin
    const isMainAdmin = !recruiterProfile.adminId

    // Function to get all team members recursively
    const getAllTeamMembers = async (adminId) => {
      const directReports = await prisma.recruiter.findMany({
        where: { adminId: adminId },
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

      let allMembers = [...directReports]

      // Get subordinates of admin members
      for (const member of directReports) {
        if (member.recruiterType === 'ADMIN') {
          const subordinates = await getAllTeamMembers(member.userId)
          allMembers = allMembers.concat(subordinates)
        }
      }

      return allMembers
    }

    // Get all team members under current admin
    const teamMembers = await getAllTeamMembers(session.user.id)

    // Add current admin to the list
    const currentAdmin = await prisma.recruiter.findUnique({
      where: { userId: session.user.id },
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

    const allMembers = currentAdmin ? [currentAdmin, ...teamMembers] : teamMembers

    // Apply filters if provided
    let filteredMembers = allMembers
    
    if (isActive !== null) {
      filteredMembers = filteredMembers.filter(m => m.isActive === (isActive === 'true'))
    }

    if (recruiterType) {
      filteredMembers = filteredMembers.filter(m => m.recruiterType === recruiterType)
    }

    if (department) {
      filteredMembers = filteredMembers.filter(m => 
        m.department && m.department.toLowerCase().includes(department.toLowerCase())
      )
    }

    // Calculate stats
    const stats = {
      total: allMembers.length,
      active: allMembers.filter(m => m.isActive).length,
      inactive: allMembers.filter(m => !m.isActive).length,
      typeDistribution: allMembers.reduce((acc, member) => {
        const existing = acc.find(item => item.type === member.recruiterType)
        if (existing) {
          existing.count++
        } else {
          acc.push({ type: member.recruiterType, count: 1 })
        }
        return acc
      }, [])
    }

    return NextResponse.json({
      teamMembers: filteredMembers,
      stats,
      hierarchy: {
        isMainAdmin,
        canCreateAdmins: isMainAdmin,
        level: isMainAdmin ? 0 : 1
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

    // Get the target recruiter to check permissions
    const targetRecruiter = await prisma.recruiter.findUnique({
      where: { id: recruiterId },
      include: { user: true }
    })

    if (!targetRecruiter) {
      return NextResponse.json(
        { message: 'Recruiter not found' },
        { status: 404 }
      )
    }

    // Check if current admin can manage this recruiter
    const isMainAdmin = !adminProfile.adminId
    const canManage = isMainAdmin || targetRecruiter.adminId === session.user.id

    if (!canManage) {
      return NextResponse.json(
        { message: 'You can only manage recruiters in your hierarchy' },
        { status: 403 }
      )
    }

    // Prevent sub-admins from creating other admins
    if (recruiterType === 'ADMIN' && !isMainAdmin) {
      return NextResponse.json(
        { message: 'Only main admin can assign admin roles' },
        { status: 403 }
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