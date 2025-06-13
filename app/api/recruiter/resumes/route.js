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

    // Get recruiter profile to check permissions
    const recruiterProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    })

    if (!recruiterProfile || !recruiterProfile.isActive) {
      return NextResponse.json(
        { message: 'Recruiter profile not found or inactive' },
        { status: 403 }
      )
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const experienceLevel = searchParams.get('experienceLevel')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause for filtering
    let whereClause = {
      isActive: true,
      user: {
        role: 'EMPLOYEE' // Only get resumes from employees
      }
    }

    if (experienceLevel) {
      whereClause.experienceLevel = experienceLevel
    }

    if (search) {
      whereClause.user = {
        ...whereClause.user,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }
    }

    // Fetch resumes with user information
    const resumes = await prisma.resume.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            experience: true,
            skills: true,
            bio: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.resume.count({
      where: whereClause
    })

    return NextResponse.json({
      resumes,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Error fetching resumes for recruiter:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}