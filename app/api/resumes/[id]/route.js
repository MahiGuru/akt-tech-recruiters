import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'public/uploads/resumes')

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Get resume details before deletion
    const resume = await prisma.resume.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!resume) {
      return NextResponse.json(
        { message: 'Resume not found' },
        { status: 404 }
      )
    }

    // Delete file from filesystem
    const filepath = join(UPLOAD_DIR, resume.filename)
    try {
      await unlink(filepath)
    } catch (fileError) {
      console.warn('Could not delete file:', fileError.message)
    }

    // If this was the primary resume, make another one primary
    if (resume.isPrimary) {
      const nextResume = await prisma.resume.findFirst({
        where: { 
          userId: resume.userId,
          id: { not: id }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (nextResume) {
        await prisma.resume.update({
          where: { id: nextResume.id },
          data: { isPrimary: true }
        })
      }
    }

    // Delete resume record
    await prisma.resume.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Resume deleted successfully'
    })

  } catch (error) {
    console.error('Resume deletion error:', error)
    return NextResponse.json(
      { message: 'Failed to delete resume' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    
    const updatedResume = await prisma.resume.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        experienceLevel: body.experienceLevel,
        isActive: body.isActive
      }
    })

    return NextResponse.json(updatedResume)
  } catch (error) {
    console.error('Error updating resume:', error)
    return NextResponse.json(
      { message: 'Failed to update resume' },
      { status: 500 }
    )
  }
}