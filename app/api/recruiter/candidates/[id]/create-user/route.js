// app/api/recruiter/candidates/[id]/create-user/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../(client)/lib/auth'
import { prisma } from '../../../../../(client)/lib/prisma'
import bcrypt from 'bcryptjs'
import { validateCandidateAccess } from '../../../../../(client)/lib/hierarchy-utils'

export async function POST(request, { params }) {
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
      where: { userId: session.user.id }
    })

    if (!recruiterProfile || !recruiterProfile.isActive) {
      return NextResponse.json(
        { message: 'Recruiter profile not found or inactive' },
        { status: 403 }
      )
    }

    const { id: candidateId } = await params
    const body = await request.json()
    const { email, password, role, workType, department } = body

    // Validate required fields
    if (!email || !password || !role || !workType) {
      return NextResponse.json(
        { message: 'Email, password, role, and work type are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['RECRUITER', 'EMPLOYER']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role specified. Must be RECRUITER or EMPLOYER' },
        { status: 400 }
      )
    }

    // Validate work type
    const validWorkTypes = ['CONSULTANT', 'PART_TIME_EMPLOYEE', 'FULL_TIME_EMPLOYEE', 'FREELANCER', 'REMOTE_WORKING']
    if (!validWorkTypes.includes(workType)) {
      return NextResponse.json(
        { message: 'Invalid work type specified' },
        { status: 400 }
      )
    }

    // Check candidate access
    const { accessible, denied } = await validateCandidateAccess([candidateId], session.user.id)
    
    if (denied.length > 0) {
      return NextResponse.json(
        { message: 'Candidate not found or access denied' },
        { status: 404 }
      )
    }

    // Get candidate details
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        createdUser: true,
        placement: true
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { message: 'Candidate not found' },
        { status: 404 }
      )
    }

    // Check if candidate is placed
    if (candidate.status !== 'PLACED') {
      return NextResponse.json(
        { message: 'Candidate must be in PLACED status to create user account' },
        { status: 400 }
      )
    }

    // Check if user already created
    if (candidate.createdUserId) {
      return NextResponse.json(
        { message: 'User account already exists for this candidate' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already exists in the system' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          name: candidate.name,
          email,
          password: hashedPassword,
          role,
          workType,
          phone: candidate.phone,
          location: candidate.location,
          experience: candidate.experience,
          skills: candidate.skills,
          bio: candidate.bio
        }
      })

      // Create recruiter profile if role is RECRUITER
      if (role === 'RECRUITER') {
        // For recruiters, use a default recruiter type (TA) but store workType in user
        await tx.recruiter.create({
          data: {
            userId: newUser.id,
            recruiterType: 'TA', // Default recruiter type
            department: department || null,
            adminId: recruiterProfile.recruiterType === 'ADMIN' ? session.user.id : recruiterProfile.adminId,
            isActive: true
          }
        })
      }

      // Update candidate with user creation info
      await tx.candidate.update({
        where: { id: candidateId },
        data: {
          createdUserId: newUser.id,
          userCreatedAt: new Date(),
          userCreatedBy: session.user.id
        }
      })

      // Create notification for the new user
      await tx.notification.create({
        data: {
          title: 'Welcome to the Team!',
          message: `Your account has been created. Role: ${role}, Work Type: ${workType.replace('_', ' ')}`,
          type: 'SUCCESS',
          receiverId: newUser.id,
          senderId: session.user.id
        }
      })

      // Create notification for admin/team about new team member
      if (role === 'RECRUITER' && recruiterProfile.adminId) {
        await tx.notification.create({
          data: {
            title: 'New Team Member Added',
            message: `${candidate.name} has been added as ${role.toLowerCase()} with work type: ${workType.replace('_', ' ')}`,
            type: 'INFO',
            receiverId: recruiterProfile.adminId,
            senderId: session.user.id
          }
        })
      }

      return newUser
    })

    return NextResponse.json({
      message: 'User account created successfully',
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role,
        createdAt: result.createdAt
      },
      candidate: {
        id: candidate.id,
        name: candidate.name,
        userCreatedAt: new Date(),
        createdUserId: result.id
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating user from candidate:', error)
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to check if user can be created
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: candidateId } = await params

    // Check candidate access
    const { accessible, denied } = await validateCandidateAccess([candidateId], session.user.id)
    
    if (denied.length > 0) {
      return NextResponse.json(
        { message: 'Candidate not found or access denied' },
        { status: 404 }
      )
    }

    // Get candidate details
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        createdUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        userCreator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { message: 'Candidate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      canCreateUser: candidate.status === 'PLACED' && !candidate.createdUserId,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        status: candidate.status,
        userCreated: !!candidate.createdUserId,
        createdUser: candidate.createdUser,
        userCreatedAt: candidate.userCreatedAt,
        userCreator: candidate.userCreator
      }
    })

  } catch (error) {
    console.error('Error checking user creation status:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}