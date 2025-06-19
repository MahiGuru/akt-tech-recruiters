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
        { message: 'Admin access required to view team hierarchy' },
        { status: 403 }
      )
    }

    // Function to determine if a user is a main admin
    const isMainAdmin = async (userId) => {
      const recruiter = await prisma.recruiter.findUnique({
        where: { userId }
      })
      
      // Main admin is an admin with no adminId (top level)
      return recruiter?.recruiterType === 'ADMIN' && !recruiter.adminId
    }

    // Function to build hierarchical structure
    const buildHierarchy = async (adminId = null, level = 0) => {
      // Get all team members under this admin
      const teamMembers = await prisma.recruiter.findMany({
        where: {
          adminId: adminId,
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
        },
        orderBy: [
          { recruiterType: 'asc' },
          { user: { name: 'asc' } }
        ]
      })

      // Build hierarchy recursively
      const hierarchy = await Promise.all(
        teamMembers.map(async (member) => {
          const subordinates = member.recruiterType === 'ADMIN' 
            ? await buildHierarchy(member.userId, level + 1)
            : []

          const mainAdmin = await isMainAdmin(member.userId)

          return {
            id: member.id,
            userId: member.userId,
            recruiterType: member.recruiterType,
            department: member.department,
            isActive: member.isActive,
            isMainAdmin: mainAdmin,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt,
            level,
            user: member.user,
            subordinates,
            adminId: member.adminId
          }
        })
      )

      return hierarchy
    }

    // Start building hierarchy
    let hierarchy = []
    const currentUserIsMainAdmin = await isMainAdmin(session.user.id)

    if (currentUserIsMainAdmin) {
      // If current user is main admin, show entire hierarchy starting from them
      const currentUserAsNode = await prisma.recruiter.findUnique({
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

      if (currentUserAsNode) {
        const subordinates = await buildHierarchy(session.user.id, 1)
        
        hierarchy = [{
          id: currentUserAsNode.id,
          userId: currentUserAsNode.userId,
          recruiterType: currentUserAsNode.recruiterType,
          department: currentUserAsNode.department,
          isActive: currentUserAsNode.isActive,
          isMainAdmin: true,
          createdAt: currentUserAsNode.createdAt,
          updatedAt: currentUserAsNode.updatedAt,
          level: 0,
          user: currentUserAsNode.user,
          subordinates,
          adminId: currentUserAsNode.adminId
        }]
      }
    } else {
      // If current user is sub-admin, show only their part of the hierarchy
      hierarchy = await buildHierarchy(session.user.id, 0)
    }

    // Calculate stats
    const flattenHierarchy = (nodes) => {
      let flat = []
      nodes.forEach(node => {
        flat.push(node)
        if (node.subordinates) {
          flat = flat.concat(flattenHierarchy(node.subordinates))
        }
      })
      return flat
    }

    const allMembers = flattenHierarchy(hierarchy)
    const stats = {
      total: allMembers.length,
      active: allMembers.filter(m => m.isActive).length,
      admins: allMembers.filter(m => m.recruiterType === 'ADMIN').length,
      levels: Math.max(...allMembers.map(m => m.level)) + 1,
      typeDistribution: allMembers.reduce((acc, member) => {
        acc[member.recruiterType] = (acc[member.recruiterType] || 0) + 1
        return acc
      }, {})
    }

    return NextResponse.json({
      hierarchy,
      stats,
      currentUser: {
        isMainAdmin: currentUserIsMainAdmin,
        level: currentUserIsMainAdmin ? 0 : 1
      }
    })

  } catch (error) {
    console.error('Error fetching team hierarchy:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
