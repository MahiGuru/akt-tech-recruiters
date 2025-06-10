import { NextResponse } from 'next/server'
import { prisma } from '../../../(client)/lib/prisma'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'public/uploads/resumes')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export async function POST(request) {
  try {
    await ensureUploadDir()
    
    const formData = await request.formData()
    const file = formData.get('resume')
    const userId = formData.get('userId')

    if (!file || !userId) {
      return NextResponse.json(
        { message: 'File and user ID are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files only.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `resume_${userId}_${timestamp}.${extension}`
    const filepath = join(UPLOAD_DIR, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update user record with resume URL
    const resumeUrl = `/uploads/resumes/${filename}`
    
    await prisma.user.update({
      where: { id: userId },
      data: { resumeUrl }
    })

    return NextResponse.json({
      message: 'Resume uploaded successfully',
      url: resumeUrl,
      filename: file.name
    })

  } catch (error) {
    console.error('Resume upload error:', error)
    return NextResponse.json(
      { message: 'Failed to upload resume' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get current resume URL
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { resumeUrl: true }
    })

    if (user?.resumeUrl) {
      // Delete file from filesystem
      const filename = user.resumeUrl.split('/').pop()
      const filepath = join(UPLOAD_DIR, filename)
      
      try {
        await unlink(filepath)
      } catch (fileError) {
        console.warn('Could not delete file:', fileError.message)
      }
    }

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: { resumeUrl: null }
    })

    return NextResponse.json({
      message: 'Resume removed successfully'
    })

  } catch (error) {
    console.error('Resume deletion error:', error)
    return NextResponse.json(
      { message: 'Failed to remove resume' },
      { status: 500 }
    )
  }
}