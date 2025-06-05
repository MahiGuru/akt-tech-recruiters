import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public/uploads/resumes');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      )
    }

    const resumes = await prisma.resume.findMany({
      where: { userId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(resumes)
  } catch (error) {
    console.error('Error fetching resumes:', error)
    return NextResponse.json(
      { message: 'Failed to fetch resumes' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    await ensureUploadDir()
    
    const formData = await request.formData()
    const file = formData.get('resume')
    const userId = formData.get('userId')
    const title = formData.get('title')
    const description = formData.get('description')
    const experienceLevel = formData.get('experienceLevel')
    const originalName = formData.get('originalName')

    if (!file || !userId || !title || !experienceLevel) {
      return NextResponse.json(
        { message: 'File, user ID, title, and experience level are required' },
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

    // Get user name for filename
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = originalName.split('.').pop()
    const cleanName = user.name.replace(/[^a-zA-Z0-9]/g, '_')
    const expLevel = experienceLevel.toLowerCase()
    const filename = `${cleanName}_${expLevel}_${timestamp}.${extension}`
    const filepath = join(UPLOAD_DIR, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Check if this is the user's first resume (make it primary)
    const existingResumes = await prisma.resume.count({
      where: { userId }
    })
    const isPrimary = existingResumes === 0

    // Create resume record
    const resume = await prisma.resume.create({
      data: {
        filename,
        originalName,
        url: `/uploads/resumes/${filename}`,
        fileSize: file.size,
        mimeType: file.type,
        title,
        description: description || null,
        experienceLevel,
        isPrimary,
        userId
      }
    })

    return NextResponse.json({
      message: 'Resume uploaded successfully',
      resume
    })

  } catch (error) {
    console.error('Resume upload error:', error)
    return NextResponse.json(
      { message: 'Failed to upload resume' },
      { status: 500 }
    )
  }
}