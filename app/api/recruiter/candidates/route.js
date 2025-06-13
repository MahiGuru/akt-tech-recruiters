import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../(client)/lib/auth'
import { prisma } from '../../../(client)/lib/prisma'

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
    const experienceLevel = searchParams.get('experienceLevel')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause for filtering
    let whereClause = {
      addedById: session.user.id // Only show candidates added by this recruiter
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

    console.log("\n\n\n\n\n", prisma, "\n\n\n\n\n");
    // Fetch candidates with resumes and application counts
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
                status: true
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
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.candidate.count({
      where: whereClause
    })

    // Get status distribution for dashboard stats
    const statusStats = await prisma.candidate.groupBy({
      by: ['status'],
      where: { addedById: session.user.id },
      _count: { status: true }
    })

    return NextResponse.json({
      candidates,
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
    console.error('Error fetching candidates:', error)
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
      notes 
    } = body

    if (!name || !email) {
      return NextResponse.json(
        { message: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if candidate already exists for this recruiter
    const existingCandidate = await prisma.candidate.findUnique({
      where: {
        email_addedById: {
          email,
          addedById: session.user.id
        }
      }
    })

    if (existingCandidate) {
      return NextResponse.json(
        { message: 'Candidate with this email already exists in your database' },
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
        addedById: session.user.id
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

    // Verify candidate belongs to this recruiter
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        addedById: session.user.id
      }
    })

    if (!existingCandidate) {
      return NextResponse.json(
        { message: 'Candidate not found or access denied' },
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
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}