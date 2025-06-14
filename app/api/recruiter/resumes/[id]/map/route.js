import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../(client)/lib/auth'
import { prisma } from '../../../../../(client)/lib/prisma'

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: resumeId } = params
    const body = await request.json()
    const { candidateId } = body

    if (!candidateId) {
      return NextResponse.json(
        { message: 'Candidate ID is required' },
        { status: 400 }
      )
    }

    // Verify resume exists and is mappable
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        candidate: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!resume) {
      return NextResponse.json(
        { message: 'Resume not found' },
        { status: 404 }
      )
    }

    // Verify candidate belongs to this recruiter
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        addedById: session.user.id
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { message: 'Candidate not found or access denied' },
        { status: 404 }
      )
    }

    // Check if resume is already mapped
    if (resume.candidateId) {
      return NextResponse.json(
        { message: 'Resume is already mapped to a candidate' },
        { status: 400 }
      )
    }

    // Map resume to candidate
    const updatedResume = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        candidateId: candidateId,
        userId: resume.userId // Preserve original user link
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            skills: true,
            experience: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        title: 'Resume Mapped to Candidate',
        message: `Resume "${resume.title}" has been mapped to candidate ${candidate.name}`,
        type: 'SUCCESS',
        receiverId: session.user.id
      }
    })

    return NextResponse.json({
      message: 'Resume mapped to candidate successfully',
      resume: updatedResume
    })

  } catch (error) {
    console.error('Error mapping resume:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}