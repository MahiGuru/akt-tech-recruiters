import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../(client)/lib/auth'
import { prisma } from '../../(client)/lib/prisma'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user can post jobs (employers and active recruiters)
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json(
        { message: 'Only employers and recruiters can post jobs' },
        { status: 403 }
      )
    }

    // Additional check for recruiters
    if (session.user.role === 'RECRUITER') {
      if (!session.user.recruiterProfile?.isActive) {
        return NextResponse.json(
          { message: 'Your recruiter account is pending approval' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const {
      title,
      company,
      location,
      salary,
      description,
      requirements = [],
      benefits = [],
      skills = [],
      jobTypes = [],
      employerId
    } = body

    // Validate required fields
    if (!title || !company || !location || !salary || !description) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Ensure the employerId matches the session user
    if (employerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Invalid employer ID' },
        { status: 403 }
      )
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        salary: salary.trim(),
        description: description.trim(),
        requirements: requirements.filter(req => req.trim()),
        benefits: benefits.filter(ben => ben.trim()),
        skills: skills,
        jobTypes: jobTypes,
        employerId,
        // Default to FULL_TIME if no job types specified
        type: jobTypes.includes('FULL_TIME') ? 'FULL_TIME' : 
              jobTypes.includes('PART_TIME') ? 'PART_TIME' :
              jobTypes.includes('CONTRACT') ? 'CONTRACT' :
              jobTypes.includes('REMOTE') ? 'REMOTE' : 'FULL_TIME'
      },
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(
      { 
        message: 'Job posted successfully',
        job 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Job posting error:', error)
    return NextResponse.json(
      { 
        message: 'Failed to post job',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const employerId = searchParams.get('employerId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')

    let whereClause = {
      isActive: true
    }

    // Filter by employer if specified
    if (employerId) {
      whereClause.employerId = employerId
    }

    // Add search functionality
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        applications: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get total count for pagination
    const totalJobs = await prisma.job.count({
      where: whereClause
    })

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total: totalJobs,
        totalPages: Math.ceil(totalJobs / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { message: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}