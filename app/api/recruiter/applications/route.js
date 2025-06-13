import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../(client)/lib/auth'
import { prisma } from '../../../(client)/lib/prisma'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')
    const jobId = searchParams.get('jobId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    let whereClause = {
      submittedById: session.user.id, // Only applications submitted by this recruiter
      candidateId: { not: null } // Only candidate applications
    }

    if (candidateId) {
      whereClause.candidateId = candidateId
    }

    if (jobId) {
      whereClause.jobId = jobId
    }

    if (status) {
      whereClause.status = status
    }

    // Fetch applications
    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            salary: true,
            type: true,
            isActive: true
          }
        },
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            experience: true,
            skills: true,
            status: true
          }
        },
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Get total count
    const totalCount = await prisma.application.count({
      where: whereClause
    })

    // Get status distribution
    const statusStats = await prisma.application.groupBy({
      by: ['status'],
      where: {
        submittedById: session.user.id,
        candidateId: { not: null }
      },
      _count: { status: true }
    })

    return NextResponse.json({
      applications,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats: {
        total: totalCount,
        statusDistribution: statusStats.map(item => ({
          status: item.status,
          count: item._count.status
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching recruiter applications:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
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

    const body = await request.json()
    const { candidateId, jobIds, coverLetter, resumeUsed } = body

    if (!candidateId || !jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { message: 'Candidate ID and at least one job ID are required' },
        { status: 400 }
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

    // Verify all jobs exist and are active
    const jobs = await prisma.job.findMany({
      where: {
        id: { in: jobIds },
        isActive: true
      }
    })

    if (jobs.length !== jobIds.length) {
      return NextResponse.json(
        { message: 'One or more jobs not found or inactive' },
        { status: 400 }
      )
    }

    // Check for existing applications
    const existingApplications = await prisma.application.findMany({
      where: {
        candidateId,
        jobId: { in: jobIds }
      }
    })

    if (existingApplications.length > 0) {
      const existingJobIds = existingApplications.map(app => app.jobId)
      const duplicateJobs = jobs.filter(job => existingJobIds.includes(job.id))
      
      return NextResponse.json(
        { 
          message: `Candidate has already applied to: ${duplicateJobs.map(j => j.title).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Create applications for all selected jobs
    const applicationPromises = jobIds.map(jobId => 
      prisma.application.create({
        data: {
          candidateId,
          jobId,
          submittedById: session.user.id,
          coverLetter: coverLetter || null,
          resumeUsed: resumeUsed || null
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              salary: true
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
    )

    const applications = await Promise.all(applicationPromises)

    return NextResponse.json({
      message: `Successfully applied ${candidate.name} to ${applications.length} job(s)`,
      applications
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating recruiter applications:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
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

    const body = await request.json()
    const { applicationId, status, notes } = body

    if (!applicationId || !status) {
      return NextResponse.json(
        { message: 'Application ID and status are required' },
        { status: 400 }
      )
    }

    // Verify application belongs to this recruiter
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        submittedById: session.user.id,
        candidateId: { not: null }
      }
    })

    if (!application) {
      return NextResponse.json(
        { message: 'Application not found or access denied' },
        { status: 404 }
      )
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        ...(notes && { coverLetter: notes }) // Using coverLetter field for notes
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true
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

    return NextResponse.json({
      message: 'Application updated successfully',
      application: updatedApplication
    })

  } catch (error) {
    console.error('Error updating application:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}