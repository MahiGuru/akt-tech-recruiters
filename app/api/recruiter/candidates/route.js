import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../(client)/lib/auth'
import { prisma } from '../../../(client)/lib/prisma'
import { 
  getAllowedRecruiterIds, 
  validateCandidateAccess,
  getHierarchyDebugInfo 
} from '../../../(client)/lib/hierarchy-utils'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if user is a recruiter
    if (session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Access denied. Recruiter role required.' },
        { status: 403 }
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const addedBy = searchParams.get('addedBy')
    const experienceLevel = searchParams.get('experienceLevel')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
 
    // FIXED: Use hierarchy utils for consistent access control
    const { ids: allowedRecruiterIds, isAdmin, hierarchyLevel, totalTeamSize } = await getAllowedRecruiterIds(session.user.id)

    // if (recruiterProfile.recruiterType === 'ADMIN') {
    //   allowedRecruiterIds = await getAllTeamUserIds(session.user.id)
    // }

    // Build where clause for filtering
    let whereClause = {
      addedById: { in: allowedRecruiterIds }
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { skills: { has: search } }
      ]
    }

    if (status) {
      whereClause.status = status
    }

    if (addedBy && allowedRecruiterIds.includes(addedBy)) {
      whereClause.addedById = addedBy
    }

    // Fetch candidates with full details INCLUDING HIERARCHY
    const candidates = await prisma.candidate.findMany({
      where: whereClause,
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
            // ADDED: Include recruiter profile with hierarchy
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
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // ADDED: Calculate hierarchy level for each candidate
    const candidatesWithHierarchy = await Promise.all(
      candidates.map(async (candidate) => {
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

        return {
          ...candidate,
          hierarchyInfo: {
            level: hierarchyLevel,
            reportingManager,
            recruiterType: candidate.addedBy?.recruiterProfile?.recruiterType || 'UNKNOWN',
            department: candidate.addedBy?.recruiterProfile?.department
          }
        }
      })
    )

    // Rest of the existing code...
    const totalCount = await prisma.candidate.count({
      where: whereClause
    })

    const statusStats = await prisma.candidate.groupBy({
      by: ['status'],
      where: { addedById: { in: allowedRecruiterIds } },
      _count: { status: true }
    })

    const upcomingInterviewsCount = await prisma.interview.count({
      where: {
        candidate: {
          addedById: { in: allowedRecruiterIds }
        },
        scheduledAt: {
          gte: new Date()
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    })

    let recruiterStats = []
    if (recruiterProfile.recruiterType === 'ADMIN') {
      const recruiterDistribution = await prisma.candidate.groupBy({
        by: ['addedById'],
        where: { addedById: { in: allowedRecruiterIds } },
        _count: { addedById: true }
      })

      recruiterStats = await Promise.all(
        recruiterDistribution.map(async (stat) => {
          const user = await prisma.user.findUnique({
            where: { id: stat.addedById },
            select: { 
              name: true, 
              email: true,
              recruiterProfile: {
                select: {
                  recruiterType: true,
                  department: true
                }
              }
            }
          })
          return {
            recruiterId: stat.addedById,
            recruiterName: user?.name || 'Unknown',
            recruiterEmail: user?.email || '',
            recruiterType: user?.recruiterProfile?.recruiterType || 'UNKNOWN',
            department: user?.recruiterProfile?.department,
            candidateCount: stat._count.addedById
          }
        })
      )
    }

    return NextResponse.json({
      candidates: candidatesWithHierarchy, // Return candidates with hierarchy
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats: {
        total: totalCount,
        upcomingInterviews: upcomingInterviewsCount,
        statusDistribution: statusStats.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        recruiterDistribution: recruiterStats
      },
      permissions: {
        isAdmin: recruiterProfile.recruiterType === 'ADMIN',
        canManageAll: recruiterProfile.recruiterType === 'ADMIN'
      }
    })

  } catch (error) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    )
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

}

export async function POST(request) {
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

    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      location, 
      experience, 
      skills, 
      bio, 
      source, 
      notes,
      addedById // Allow admin to add candidates for other recruiters
    } = body

    if (!name || !email) {
      return NextResponse.json(
        { message: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Determine who is adding the candidate
    let actualAddedById = session.user.id
    
    // FIXED: If admin is adding for another recruiter, check hierarchy
    if (addedById && recruiterProfile.recruiterType === 'ADMIN') {
      const { ids: allowedRecruiterIds } = await getAllowedRecruiterIds(session.user.id)
      if (allowedRecruiterIds.includes(addedById)) {
        actualAddedById = addedById
      }
    }

    // Check if candidate already exists for this recruiter
    const existingCandidate = await prisma.candidate.findUnique({
      where: {
        email_addedById: {
          email,
          addedById: actualAddedById
        }
      }
    })

    if (existingCandidate) {
      return NextResponse.json(
        { message: 'Candidate with this email already exists in the database' },
        { status: 400 }
      )
    }

    // Create candidate
    const candidate = await prisma.candidate.create({
      data: {
        name,
        email,
        phone: phone || null,
        location: location || null,
        experience: experience ? parseInt(experience) : null,
        skills: skills || [],
        bio: bio || null,
        source: source || null,
        notes: notes || null,
        addedById: actualAddedById
      },
      include: {
        resumes: true,
        applications: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                company: true
              }
            }
          }
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
          }
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

    return NextResponse.json({
      message: 'Candidate added successfully',
      candidate
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating candidate:', error)
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
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

    const body = await request.json()
    const { 
      candidateId,
      name, 
      email, 
      phone, 
      location, 
      experience, 
      skills, 
      bio, 
      source, 
      notes,
      status
    } = body

    if (!candidateId) {
      return NextResponse.json(
        { message: 'Candidate ID is required' },
        { status: 400 }
      )
    }

    // FIXED: Use hierarchy utils for access validation
    const { accessible, denied } = await validateCandidateAccess([candidateId], session.user.id)
    
    if (denied.length > 0) {
      return NextResponse.json(
        { message: 'Candidate not found or access denied' },
        { status: 404 }
      )
    }

    const existingCandidate = await prisma.candidate.findFirst({
      where: { id: candidateId }
    })

    if (!existingCandidate) {
      return NextResponse.json(
        { message: 'Candidate not found' },
        { status: 404 }
      )
    }

    // Update candidate
    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        name: name || existingCandidate.name,
        email: email || existingCandidate.email,
        phone: phone !== undefined ? phone : existingCandidate.phone,
        location: location !== undefined ? location : existingCandidate.location,
        experience: experience !== undefined ? (experience ? parseInt(experience) : null) : existingCandidate.experience,
        skills: skills !== undefined ? skills : existingCandidate.skills,
        bio: bio !== undefined ? bio : existingCandidate.bio,
        source: source !== undefined ? source : existingCandidate.source,
        notes: notes !== undefined ? notes : existingCandidate.notes,
        status: status || existingCandidate.status
      },
      include: {
        resumes: true,
        applications: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                company: true
              }
            }
          }
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
          }
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

    return NextResponse.json({
      message: 'Candidate updated successfully',
      candidate: updatedCandidate
    })

  } catch (error) {
    console.error('Error updating candidate:', error)
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}