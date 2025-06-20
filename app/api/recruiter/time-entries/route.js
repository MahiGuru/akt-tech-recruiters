// app/api/recruiter/time-entries/route.js
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const viewMode = searchParams.get('viewMode') || 'week'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    const dateFilter = {}
    if (startDate && endDate) {
      dateFilter.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Fetch time entries for the current user
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        ...dateFilter
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Calculate summary statistics
    const totalHours = entries.reduce((sum, entry) => 
      sum + parseFloat(entry.hours), 0
    )
    
    const approvedHours = entries
      .filter(entry => entry.status === 'APPROVED')
      .reduce((sum, entry) => sum + parseFloat(entry.hours), 0)
    
    const pendingHours = entries
      .filter(entry => entry.status === 'PENDING')
      .reduce((sum, entry) => sum + parseFloat(entry.hours), 0)

    return NextResponse.json({
      entries,
      summary: {
        totalHours: totalHours.toFixed(2),
        approvedHours: approvedHours.toFixed(2),
        pendingHours: pendingHours.toFixed(2),
        entryCount: entries.length
      }
    })

  } catch (error) {
    console.error('Error fetching time entries:', error)
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

    // Check if user is main admin (main admins cannot log time)
    const isMainAdmin = recruiterProfile.recruiterType === 'ADMIN' && !recruiterProfile.adminId

    if (isMainAdmin) {
      return NextResponse.json(
        { message: 'Main administrators cannot log time entries. Only approve time for team members.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { entries, date, hours, description, project } = body

    // Handle bulk entries
    if (entries && Array.isArray(entries)) {
      const validEntries = []
      const errors = []

      // Validate each entry
      for (const entry of entries) {
        if (!entry.date || !entry.hours) {
          errors.push(`Entry missing date or hours: ${JSON.stringify(entry)}`)
          continue
        }

        const hoursFloat = parseFloat(entry.hours)
        if (isNaN(hoursFloat) || hoursFloat <= 0 || hoursFloat > 24) {
          errors.push(`Invalid hours for ${entry.date}: ${entry.hours}`)
          continue
        }

        // Check for duplicate entry on the same date
        const existingEntry = await prisma.timeEntry.findFirst({
          where: {
            userId: session.user.id,
            date: new Date(entry.date)
          }
        })

        if (existingEntry) {
          errors.push(`Time entry already exists for ${entry.date}`)
          continue
        }

        validEntries.push({
          userId: session.user.id,
          date: new Date(entry.date),
          hours: hoursFloat,
          description: entry.description || null,
          project: entry.project || null,
          status: 'PENDING'
        })
      }

      if (errors.length > 0 && validEntries.length === 0) {
        return NextResponse.json(
          { message: 'No valid entries to create', errors },
          { status: 400 }
        )
      }

      // Create bulk entries
      const createdEntries = await prisma.timeEntry.createMany({
        data: validEntries
      })

      // Send single notification to manager for bulk entry
      if (recruiterProfile.adminId && validEntries.length > 0) {
        const totalHours = validEntries.reduce((sum, entry) => sum + entry.hours, 0)
        await prisma.notification.create({
          data: {
            title: 'Bulk Time Entries for Approval',
            message: `${session.user.name} submitted ${validEntries.length} time entries totaling ${totalHours} hours`,
            type: 'APPROVAL_REQUEST',
            receiverId: recruiterProfile.adminId,
            senderId: session.user.id
          }
        })
      }

      return NextResponse.json({
        message: `Successfully created ${createdEntries.count} time entries`,
        created: createdEntries.count,
        errors: errors.length > 0 ? errors : undefined
      }, { status: 201 })
    }

    // Handle single entry (existing logic)
    if (!date || !hours) {
      return NextResponse.json(
        { message: 'Date and hours are required' },
        { status: 400 }
      )
    }

    const hoursFloat = parseFloat(hours)
    if (isNaN(hoursFloat) || hoursFloat <= 0 || hoursFloat > 24) {
      return NextResponse.json(
        { message: 'Hours must be a valid number between 0 and 24' },
        { status: 400 }
      )
    }

    // Check for duplicate entry on the same date
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        date: new Date(date)
      }
    })

    if (existingEntry) {
      return NextResponse.json(
        { message: 'Time entry already exists for this date' },
        { status: 400 }
      )
    }

    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: session.user.id,
        date: new Date(date),
        hours: hoursFloat,
        description: description || null,
        project: project || null,
        status: 'PENDING'
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

    // Send notification to manager if they have one
    if (recruiterProfile.adminId) {
      await prisma.notification.create({
        data: {
          title: 'New Time Entry for Approval',
          message: `${session.user.name} submitted ${hoursFloat} hours for ${new Date(date).toLocaleDateString()}`,
          type: 'APPROVAL_REQUEST',
          receiverId: recruiterProfile.adminId,
          senderId: session.user.id
        }
      })
    }

    return NextResponse.json({
      message: 'Time entry created successfully',
      entry: timeEntry
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating time entry:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}