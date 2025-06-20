// app/api/recruiter/resumes/[id]/unmap/route.js (Updated for Admin Access)
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

    // Determine access scope
    const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
    let allowedRecruiterIds = [session.user.id]

    if (isAdmin) {
      allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    }

    // Verify resume exists and is mapped
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            addedById: true,
            addedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
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

    // Check if user has permission to unmap
    const canUnmap = isAdmin || allowedRecruiterIds.includes(resume.candidate.addedById)

    if (!canUnmap) {
      return NextResponse.json(
        { message: 'Cannot unmap resume from candidate you do not have access to' },
        { status: 403 }
      )
    }

    // Store candidate info for notification before unmapping
    const candidateName = resume.candidate.name
    const candidateOwnerId = resume.candidate.addedById

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

    // Create notification for current user
    await prisma.notification.create({
      data: {
        title: 'Resume Unmapped from Candidate',
        message: `Resume "${resume.title}" has been unmapped from candidate ${candidateName}`,
        type: 'INFO',
        receiverId: session.user.id
      }
    })

    // If admin unmapped for another recruiter, notify them too
    if (isAdmin && candidateOwnerId !== session.user.id) {
      await prisma.notification.create({
        data: {
          title: 'Resume Unmapped by Admin',
          message: `Admin ${session.user.name} unmapped resume "${resume.title}" from your candidate ${candidateName}`,
          type: 'INFO',
          receiverId: candidateOwnerId,
          senderId: session.user.id
        }
      })
    }

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