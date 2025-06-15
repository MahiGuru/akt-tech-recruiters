// app/api/recruiter/team/add/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../(client)/lib/auth'
import { prisma } from '../../../../(client)/lib/prisma'
import bcrypt from 'bcrypt'

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
        { message: 'Admin access required to add team members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, recruiterType, department, password } = body

    if (!name || !email || !recruiterType || !password) {
      return NextResponse.json(
        { message: 'Name, email, recruiter type, and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Validate recruiter type
    const validTypes = ['ADMIN', 'TA', 'HR', 'CS', 'LEAD', 'JUNIOR']
    if (!validTypes.includes(recruiterType)) {
      return NextResponse.json(
        { message: 'Invalid recruiter type' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and recruiter profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'RECRUITER'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      })

      // Create recruiter profile
      const recruiterProfile = await tx.recruiter.create({
        data: {
          userId: user.id,
          recruiterType,
          department: department || null,
          isActive: true,
          adminId: session.user.id // Set current admin as the admin
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

      return {
        user,
        recruiterProfile
      }
    })

    // Create notification for the new team member
    await prisma.notification.create({
      data: {
        title: 'Welcome to the Team!',
        message: `You have been added to the recruiting team as a ${recruiterType}. Your default password has been provided by your admin.`,
        type: 'SUCCESS',
        receiverId: result.user.id,
        senderId: session.user.id
      }
    })

    // Create notification for admin confirmation
    await prisma.notification.create({
      data: {
        title: 'New Team Member Added',
        message: `${name} has been successfully added to your team as a ${recruiterType}.`,
        type: 'SUCCESS',
        receiverId: session.user.id
      }
    })

    return NextResponse.json({
      message: 'Team member added successfully',
      teamMember: result.recruiterProfile,
      generatedPassword: password // Return for admin to share
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding team member:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}