// app/api/recruiter/resumes/[id]/map/route.js (Updated for Admin Access)
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../(client)/lib/auth'
import { prisma } from '../../../../../(client)/lib/prisma'

// Helper function to get team member IDs for admin
async function getTeamMemberIds(adminUserId) {
  const visited = new Set()
  const toVisit = [adminId]

  while (toVisit.length > 0) {
    const currentAdminId = toVisit.pop()

    if (!visited.has(currentAdminId)) {
      visited.add(currentAdminId)

      const team = await prisma.recruiter.findMany({
        where: { adminId: currentAdminId, isActive: true },
        select: { userId: true }
      })

      team.forEach(member => {
        if (!visited.has(member.userId)) {
          toVisit.push(member.userId)
        }
      })
    }
  }

  return Array.from(visited)
}

export async function PUT(request, { params }) {
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

    const { id: resumeId } = params
    const body = await request.json()
    const { candidateId } = body

    if (!candidateId) {
      return NextResponse.json(
        { message: 'Candidate ID is required' },
        { status: 400 }
      )
    }

    // Determine access scope
    const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
    let allowedRecruiterIds = [session.user.id]

    if (isAdmin) {
      allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    }

    // Verify resume exists and is accessible
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
            email: true,
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

    // Check if admin can access this resume
    if (resume.candidateId && !allowedRecruiterIds.includes(resume.candidate.addedById)) {
      return NextResponse.json(
        { message: 'Resume access denied' },
        { status: 403 }
      )
    }

    // Verify candidate belongs to accessible recruiters
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        addedById: { in: allowedRecruiterIds }
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
            experience: true,
            addedById: true,
            addedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
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

    // If admin mapped for another recruiter, notify them too
    if (isAdmin && candidate.addedById !== session.user.id) {
      await prisma.notification.create({
        data: {
          title: 'Resume Mapped by Admin',
          message: `Admin ${session.user.name} mapped resume "${resume.title}" to your candidate ${candidate.name}`,
          type: 'INFO',
          receiverId: candidate.addedById,
          senderId: session.user.id
        }
      })
    }

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