import { NextResponse } from 'next/server'
import { prisma } from '../../(client)/lib/prisma'

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
            skills: true
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
    const { jobId, employeeId, coverLetter, resumeId } = body

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

    // Get resume information if resumeId is provided
    let resumeUsed = null
    if (resumeId) {
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
        select: { title: true, experienceLevel: true }
      })
      
      if (resume) {
        resumeUsed = `${resume.title} (${resume.experienceLevel.replace('_', ' ')})`
      }
    } else {
      // If no specific resume, try to use the primary resume
      const primaryResume = await prisma.resume.findFirst({
        where: { 
          userId: employeeId,
          isPrimary: true 
        },
        select: { id: true, title: true, experienceLevel: true }
      })
      
      if (primaryResume) {
        resumeUsed = `${primaryResume.title} (${primaryResume.experienceLevel.replace('_', ' ')})`
      }
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        employeeId,
        coverLetter: coverLetter || null,
        resumeUsed
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