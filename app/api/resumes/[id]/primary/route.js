import { NextResponse } from 'next/server'
import { prisma } from '../../../../(client)/lib/prisma'

export async function PUT(request, { params }) {
  try {
    const { id } = params

    // Get the resume to find the user
    const resume = await prisma.resume.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!resume) {
      return NextResponse.json(
        { message: 'Resume not found' },
        { status: 404 }
      )
    }

    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // First, set all user's resumes to non-primary
      await tx.resume.updateMany({
        where: { userId: resume.userId },
        data: { isPrimary: false }
      })

      // Then set the selected resume as primary
      await tx.resume.update({
        where: { id },
        data: { isPrimary: true }
      })
    })

    return NextResponse.json({
      message: 'Primary resume updated successfully'
    })

  } catch (error) {
    console.error('Error setting primary resume:', error)
    return NextResponse.json(
      { message: 'Failed to set primary resume' },
      { status: 500 }
    )
  }
}