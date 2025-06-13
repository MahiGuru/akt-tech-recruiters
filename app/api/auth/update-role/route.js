import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../(client)/lib/auth'
import { prisma } from '../../../(client)/lib/prisma'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, role } = body

    // Verify the user is updating their own role
    if (session.user.id !== userId) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    // Validate role
    if (!['EMPLOYEE', 'EMPLOYER', 'RECRUITER'].includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role' },
        { status: 400 }
      )
    }

    // Update user role
    // Update user role in a transaction to handle recruiter profile creation
    const result = await prisma.$transaction(async (tx) => {
      // Update user role
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true
        }
      })

      // Create recruiter profile if role is RECRUITER
      if (role === 'RECRUITER') {
        const recruiterProfile = await tx.recruiter.create({
          data: {
            userId: userId,
            recruiterType: 'TA', // Default to Technical Analyst
            isActive: true,
          },
        })

        return {
          ...updatedUser,
          recruiterProfile: {
            id: recruiterProfile.id,
            recruiterType: recruiterProfile.recruiterType,
            department: recruiterProfile.department,
            isActive: recruiterProfile.isActive
          }
        }
      }

      return updatedUser
    })

    return NextResponse.json({
      message: 'Role updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}