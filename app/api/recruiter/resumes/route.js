// app/api/recruiter/resumes/route.js (Updated for Admin Access)
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../(client)/lib/auth'
import { prisma } from '../../../(client)/lib/prisma';
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

// Helper function to get team member IDs for admin
async function getTeamMemberIds(adminUserId) {
  const teamMembers = await prisma.recruiter.findMany({
    where: {
      OR: [
        { adminId: adminUserId }, // Team members
        { userId: adminUserId, recruiterType: 'ADMIN' } // Current admin
      ],
      isActive: true
    },
    select: { userId: true }
  })
  return teamMembers.map(member => member.userId)
}

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const candidateId = searchParams.get('candidateId')
    const addedBy = searchParams.get('addedBy') // Filter by recruiter who added candidate

    let resumes = []

    // Determine access scope based on admin status
    const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
    let allowedRecruiterIds = [session.user.id]

    if (isAdmin) {
      allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    }

    if (userId) {
      // Get resumes for a specific user (only if accessible)
      resumes = await prisma.resume.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'desc' }
        ]
      })
    } else if (candidateId) {
      // Get resumes for a specific candidate (check if candidate belongs to accessible recruiters)
      const candidate = await prisma.candidate.findFirst({
        where: {
          id: candidateId,
          addedById: { in: allowedRecruiterIds }
        }
      })

      if (!candidate) {
        return NextResponse.json(
          { message: 'Candidate not found or access denied' },
          { status: 403 }
        )
      }

      resumes = await prisma.resume.findMany({
        where: { candidateId },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              addedById: true,
              addedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'desc' }
        ]
      })
    } else {
      // Get all resumes accessible to this recruiter
      // This includes:
      // 1. All user resumes (public resumes from job applications)
      // 2. Resumes from candidates added by accessible recruiters
      
      const userResumes = await prisma.resume.findMany({
        where: { 
          userId: { not: null },
          isActive: true
        },
        include: {
          user: {
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
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'desc' }
        ]
      })

      // Candidate resumes filter
      let candidateResumeWhere = {
        candidateId: { not: null },
        isActive: true,
        candidate: {
          addedById: { in: allowedRecruiterIds }
        }
      }

      // If admin is filtering by specific recruiter
      if (addedBy && isAdmin && allowedRecruiterIds.includes(addedBy)) {
        candidateResumeWhere.candidate.addedById = addedBy
      }

      const candidateResumes = await prisma.resume.findMany({
        where: candidateResumeWhere,
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              location: true,
              experience: true,
              skills: true,
              addedById: true,
              addedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'desc' }
        ]
      })

      resumes = [...userResumes, ...candidateResumes]
    }

    // Add management permissions to each resume
    const resumesWithPermissions = resumes.map(resume => ({
      ...resume,
      canEdit: isAdmin || (resume.candidate?.addedById === session.user.id),
      canDelete: isAdmin || (resume.candidate?.addedById === session.user.id),
      canMap: isAdmin || !resume.candidateId, // Can map if admin or unmapped
      canUnmap: isAdmin || (resume.candidate?.addedById === session.user.id)
    }))

    return NextResponse.json({
      resumes: resumesWithPermissions,
      total: resumesWithPermissions.length,
      permissions: {
        isAdmin,
        canManageAll: isAdmin
      }
    })
  } catch (error) {
    console.error('Error fetching resumes:', error)
    return NextResponse.json(
      { message: 'Failed to fetch resumes', details: error.message },
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

    await ensureUploadDir()
    
    const formData = await request.formData()
    const file = formData.get('resume')
    const userId = formData.get('userId')
    const candidateId = formData.get('candidateId')
    const title = formData.get('title')
    const description = formData.get('description')
    const experienceLevel = formData.get('experienceLevel')
    const originalName = formData.get('originalName')

    if (!file || (!userId && !candidateId) || !title || !experienceLevel) {
      return NextResponse.json(
        { message: 'File, userId or candidateId, title, and experience level are required' },
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

    // Get name for filename (from user or candidate)
    let ownerName = 'unknown'
    let ownerId = userId || candidateId
    
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      })
      if (user) ownerName = user.name
    } else if (candidateId) {
      // Check if candidate is accessible to this recruiter
      const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
      let allowedRecruiterIds = [session.user.id]

      if (isAdmin) {
        allowedRecruiterIds = await getTeamMemberIds(session.user.id)
      }

      const candidate = await prisma.candidate.findFirst({
        where: { 
          id: candidateId,
          addedById: { in: allowedRecruiterIds }
        },
        select: { name: true }
      })
      
      if (!candidate) {
        return NextResponse.json(
          { message: 'Candidate not found or access denied' },
          { status: 404 }
        )
      }
      
      if (candidate) ownerName = candidate.name
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = originalName.split('.').pop()
    const cleanName = ownerName.replace(/[^a-zA-Z0-9]/g, '_')
    const expLevel = experienceLevel.toLowerCase()
    const ownerType = userId ? 'user' : 'candidate'
    const filename = `${ownerType}_${cleanName}_${expLevel}_${timestamp}.${extension}`
    const filepath = join(UPLOAD_DIR, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Check if this is the first resume (make it primary)
    const whereClause = userId ? { userId } : { candidateId }
    const existingResumes = await prisma.resume.count({ where: whereClause })
    const isPrimary = existingResumes === 0

    // Create resume record
    const resumeData = {
      filename,
      originalName,
      url: `/uploads/resumes/${filename}`,
      fileSize: file.size,
      mimeType: file.type,
      title,
      description: description || null,
      experienceLevel,
      isPrimary,
      ...(userId ? { userId } : { candidateId })
    }

    const resume = await prisma.resume.create({
      data: resumeData,
      include: {
        ...(userId && {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }),
        ...(candidateId && {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              addedById: true,
              addedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        })
      }
    })

    return NextResponse.json({
      message: 'Resume uploaded successfully',
      resume
    })

  } catch (error) {
    console.error('Resume upload error:', error)
    return NextResponse.json(
      { message: 'Failed to upload resume', details: error.message },
      { status: 500 }
    )
  }
}