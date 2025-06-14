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

    // Verify resume exists and is mapped
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            addedById: true
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

    if (!resume.candidateId) {
      return NextResponse.json(
        { message: 'Resume is not mapped to any candidate' },
        { status: 400 }
      )
    }

    // Verify candidate belongs to recruiter
    if (resume.candidate.addedById !== session.user.id) {
      return NextResponse.json(
        { message: 'Cannot unmap resume from candidate you do not manage' },
        { status: 403 }
      )
    }

    // Unmap resume
    const updatedResume = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        candidateId: null
      },
      include: {
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
        title: 'Resume Unmapped from Candidate',
        message: `Resume "${resume.title}" has been unmapped from candidate ${resume.candidate.name}`,
        type: 'INFO',
        receiverId: session.user.id
      }
    })

    return NextResponse.json({
      message: 'Resume unmapped from candidate successfully',
      resume: updatedResume
    })

  } catch (error) {
    console.error('Error unmapping resume:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}