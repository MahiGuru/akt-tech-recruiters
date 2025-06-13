import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../(client)/lib/auth'
import { prisma } from '../../../../(client)/lib/prisma'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Get candidate with full details
    const candidate = await prisma.candidate.findFirst({
      where: {
        id,
        addedById: session.user.id // Ensure recruiter owns this candidate
      },
      include: {
        resumes: {
          where: { isActive: true },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'desc' }
          ]
        },
        applications: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                company: true,
                location: true,
                salary: true,
                isActive: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        addedBy: {
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
        { message: 'Candidate not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json(candidate)

  } catch (error) {
    console.error('Error fetching candidate:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Verify candidate belongs to this recruiter
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        id,
        addedById: session.user.id
      }
    })

    if (!existingCandidate) {
      return NextResponse.json(
        { message: 'Candidate not found or access denied' },
        { status: 404 }
      )
    }

    // Delete candidate (this will cascade delete applications and resumes)
    await prisma.candidate.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Candidate deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting candidate:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}