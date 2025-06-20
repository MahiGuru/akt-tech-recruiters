// app/api/recruiter/candidates/[id]/route.js (Updated for Admin Access)
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../(client)/lib/auth'
import { prisma } from '../../../../(client)/lib/prisma'

// Helper function to get team member IDs for admin
async function getTeamMemberIds(adminUserId) {
  const visited = new Set()
  const toVisit = [adminUserId]

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

export async function GET(request, { params }) {
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
    
    const promisedParams = await params;
    const { id } = promisedParams

    // Determine access scope
    const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
    let allowedRecruiterIds = [session.user.id]

    if (isAdmin) {
      allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    }

    // Get candidate with full details including hierarchy - check if accessible
    const candidate = await prisma.candidate.findFirst({
      where: {
        id,
        addedById: { in: allowedRecruiterIds }
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
        interviews: {
          include: {
            scheduledBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { scheduledAt: 'asc' }
        },
        addedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            // ADDED: Include hierarchy information
            recruiterProfile: {
              select: {
                id: true,
                recruiterType: true,
                department: true,
                adminId: true,
                adminRecruiter: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    recruiterProfile: {
                      select: {
                        recruiterType: true,
                        department: true
                      }
                    }
                  }
                }
              }
            }
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

    // ADDED: Calculate hierarchy information
    let hierarchyLevel = 1
    let reportingManager = null
    
    if (candidate.addedBy?.recruiterProfile) {
      const recruiterProfile = candidate.addedBy.recruiterProfile
      
      // If recruiter has an admin, calculate their level
      if (recruiterProfile.adminId) {
        hierarchyLevel = await calculateRecruiterLevel(recruiterProfile.adminId, session.user.id)
        reportingManager = recruiterProfile.adminRecruiter
      } else if (recruiterProfile.recruiterType === 'ADMIN') {
        // If this is a top-level admin
        hierarchyLevel = 1
      }
    }

    // Add hierarchy info and management permissions to the response
    const candidateWithPermissions = {
      ...candidate,
      hierarchyInfo: {
        level: hierarchyLevel,
        reportingManager,
        recruiterType: candidate.addedBy?.recruiterProfile?.recruiterType || 'UNKNOWN',
        department: candidate.addedBy?.recruiterProfile?.department
      },
      permissions: {
        canEdit: isAdmin || candidate.addedById === session.user.id,
        canDelete: isAdmin || candidate.addedById === session.user.id,
        canScheduleInterview: isAdmin || candidate.addedById === session.user.id,
        canMapResumes: isAdmin,
        canManageApplications: isAdmin || candidate.addedById === session.user.id,
        isAdmin
      }
    }

    return NextResponse.json(candidateWithPermissions)

  } catch (error) {
    console.error('Error fetching candidate:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ADDED: Helper function to calculate recruiter level in hierarchy
async function calculateRecruiterLevel(adminId, topAdminId, currentLevel = 2) {
  if (adminId === topAdminId) {
    return currentLevel
  }

  const admin = await prisma.recruiter.findUnique({
    where: { userId: adminId },
    select: { adminId: true }
  })

  if (!admin || !admin.adminId) {
    return currentLevel
  }

  return calculateRecruiterLevel(admin.adminId, topAdminId, currentLevel + 1)
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

    const { id } = params

    // Determine access scope
    const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
    let allowedRecruiterIds = [session.user.id]

    if (isAdmin) {
      allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    }

    // Verify candidate exists and is accessible
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        id,
        addedById: { in: allowedRecruiterIds }
      },
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!existingCandidate) {
      return NextResponse.json(
        { message: 'Candidate not found or access denied' },
        { status: 404 }
      )
    }

    // Check if user can delete this specific candidate
    const canDelete = isAdmin || existingCandidate.addedById === session.user.id

    if (!canDelete) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this candidate' },
        { status: 403 }
      )
    }

    // Delete candidate (this will cascade delete applications, resumes, and interviews)
    await prisma.candidate.delete({
      where: { id }
    })

    // Create notification for the original recruiter if admin deleted
    if (isAdmin && existingCandidate.addedById !== session.user.id) {
      await prisma.notification.create({
        data: {
          title: 'Candidate Deleted by Admin',
          message: `Admin ${session.user.name} deleted candidate ${existingCandidate.name} from your list`,
          type: 'INFO',
          receiverId: existingCandidate.addedById,
          senderId: session.user.id
        }
      })
    }

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