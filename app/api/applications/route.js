import { NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const employerId = searchParams.get('employerId')

    let where = {}
    
    if (employeeId) {
      where.employeeId = employeeId
    } else if (employerId) {
      where.job = {
        employerId: employerId
      }
    }

    const applications = await prisma.application.findMany({
      where,
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
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            experience: true,
            skills: true,
            resumeUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(applications)
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { jobId, employeeId, coverLetter } = body

    // Check if application already exists
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_employeeId: {
          jobId,
          employeeId
        }
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { message: 'You have already applied for this job' },
        { status: 400 }
      )
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        employeeId,
        coverLetter: coverLetter || null
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
