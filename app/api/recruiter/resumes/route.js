// app/api/recruiter/resumes/route.js (Fixed for Bulk Upload)
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../(client)/lib/auth'
import { prisma } from '../../../(client)/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const BASE_UPLOAD_DIR = join(process.cwd(), 'public/uploads/resumes');
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

// Helper function to create recruiter-specific directory
async function getRecruiterUploadDir(recruiterId, recruiterName) {
  // Clean the recruiter name for use in directory path
  const cleanName = recruiterName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
  const dirName = `${cleanName}-${recruiterId}`
  const recruiterDir = join(BASE_UPLOAD_DIR, dirName)
  
  // Ensure base directory exists
  if (!existsSync(BASE_UPLOAD_DIR)) {
    await mkdir(BASE_UPLOAD_DIR, { recursive: true })
  }
  
  // Ensure recruiter-specific directory exists
  if (!existsSync(recruiterDir)) {
    await mkdir(recruiterDir, { recursive: true })
    console.log(`Created recruiter directory: ${recruiterDir}`)
  }
  
  return { recruiterDir, dirName }
}

// Ensure base upload directory exists
async function ensureBaseUploadDir() {
  if (!existsSync(BASE_UPLOAD_DIR)) {
    await mkdir(BASE_UPLOAD_DIR, { recursive: true })
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
      // 3. FIXED: Unmapped resumes uploaded by this recruiter
      
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

      // FIXED: Also get unmapped resumes (no userId and no candidateId)
      // These are resumes uploaded through bulk upload without assignment
      const unmappedResumes = await prisma.resume.findMany({
        where: {
          userId: null,
          candidateId: null,
          isActive: true,
          // Add some way to track which recruiter uploaded them
          // For now, we'll include all unmapped resumes for any recruiter
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      })

      resumes = [...userResumes, ...candidateResumes, ...unmappedResumes]
    }

    // Add management permissions to each resume
    const resumesWithPermissions = resumes.map(resume => ({
      ...resume,
      canEdit: isAdmin || (resume.candidate?.addedById === session.user.id) || (!resume.candidateId && !resume.userId),
      canDelete: isAdmin || (resume.candidate?.addedById === session.user.id) || (!resume.candidateId && !resume.userId),
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

    await ensureBaseUploadDir()
    
    const formData = await request.formData()
    const file = formData.get('resume')
    const userId = formData.get('userId')
    const candidateId = formData.get('candidateId')
    const title = formData.get('title')
    const description = formData.get('description')
    const experienceLevel = formData.get('experienceLevel')
    const originalName = formData.get('originalName')
    const uploadType = formData.get('uploadType') // NEW: To identify bulk uploads

    // FIXED: Allow uploads without userId or candidateId for bulk uploads
    if (!file || !title || !experienceLevel) {
      return NextResponse.json(
        { message: 'File, title, and experience level are required' },
        { status: 400 }
      )
    }

    // FIXED: For bulk uploads, we don't require userId or candidateId
    // The resume can be uploaded unmapped and assigned later
    const isBulkUpload = uploadType === 'bulk'
    if (!isBulkUpload && !userId && !candidateId) {
      return NextResponse.json(
        { message: 'Either userId or candidateId is required for non-bulk uploads' },
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

    // Get recruiter-specific upload directory
    const { recruiterDir, dirName } = await getRecruiterUploadDir(
      session.user.id, 
      session.user.name || 'Unknown'
    )

    // Get name for filename (from user, candidate, or default)
    let ownerName = 'unmapped'
    let ownerId = userId || candidateId || 'unmapped'
    
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
    const ownerType = userId ? 'user' : candidateId ? 'candidate' : 'unmapped'
    const filename = `${ownerType}_${cleanName}_${expLevel}_${timestamp}.${extension}`
    const filepath = join(recruiterDir, filename)

    // Convert file to buffer and save to recruiter-specific directory
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Check if this is the first resume (make it primary)
    let whereClause = {}
    if (userId) {
      whereClause = { userId }
    } else if (candidateId) {
      whereClause = { candidateId }
    } else {
      // For unmapped resumes, don't set as primary initially
      whereClause = { userId: null, candidateId: null }
    }
    
    const existingResumes = await prisma.resume.count({ where: whereClause })
    const isPrimary = existingResumes === 0 && (userId || candidateId) // Only primary if mapped

    // Create resume record with recruiter-specific URL path
    const resumeUrl = `/uploads/resumes/${dirName}/${filename}`
    const resumeData = {
      filename,
      originalName,
      url: resumeUrl,
      fileSize: file.size,
      mimeType: file.type,
      title,
      description: description || null,
      experienceLevel,
      isPrimary,
      // FIXED: Allow null values for unmapped resumes
      userId: userId || null,
      candidateId: candidateId || null
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

    console.log(`Resume uploaded successfully to: ${filepath}`)
    console.log(`Resume URL: ${resumeUrl}`)
    console.log(`Upload type: ${isBulkUpload ? 'bulk' : 'standard'}`)

    return NextResponse.json({
      message: 'Resume uploaded successfully',
      resume: {
        ...resume,
        // Add flags for unmapped status
        isUnmapped: !resume.userId && !resume.candidateId,
        canMap: true,
        uploadType: isBulkUpload ? 'bulk' : 'standard'
      },
      uploadInfo: {
        directory: dirName,
        filepath: resumeUrl,
        isBulkUpload,
        isUnmapped: !userId && !candidateId
      }
    })

  } catch (error) {
    console.error('Resume upload error:', error)
    return NextResponse.json(
      { message: 'Failed to upload resume', details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to find and delete file in directory structure
async function findAndDeleteResumeFile(filename, resumeUrl) {
  console.log(`Attempting to delete resume file: ${filename}`);
  console.log(`Resume URL: ${resumeUrl}`);
  
  // Extract the relative path from the URL
  if (resumeUrl.startsWith('/uploads/resumes/')) {
    const relativePath = resumeUrl.replace('/uploads/resumes/', '');
    const fullFilePath = join(BASE_UPLOAD_DIR, relativePath);
    
    try {
      // Check if file exists at the URL-specified path
      const { access, constants, unlink } = await import('fs/promises');
      await access(fullFilePath, constants.F_OK);
      await unlink(fullFilePath);
      console.log(`✅ Successfully deleted file: ${fullFilePath}`);
      return true;
    } catch (error) {
      console.warn(`Failed to delete file at URL path ${fullFilePath}:`, error.message);
    }
  }
  
  // Fallback: try to find file in old flat structure
  const flatPath = join(BASE_UPLOAD_DIR, filename);
  try {
    const { access, constants, unlink } = await import('fs/promises');
    await access(flatPath, constants.F_OK);
    await unlink(flatPath);
    console.log(`✅ Successfully deleted file from flat structure: ${flatPath}`);
    return true;
  } catch (error) {
    console.warn(`File not found in flat structure: ${flatPath}`);
  }
  
  // Last resort: search all subdirectories
  try {
    const { readdir, stat, access, constants, unlink } = await import('fs/promises');
    const items = await readdir(BASE_UPLOAD_DIR);
    
    for (const item of items) {
      const itemPath = join(BASE_UPLOAD_DIR, item);
      const stats = await stat(itemPath);
      
      if (stats.isDirectory()) {
        const possibleFilePath = join(itemPath, filename);
        try {
          await access(possibleFilePath, constants.F_OK);
          await unlink(possibleFilePath);
          console.log(`✅ Successfully deleted file from subdirectory: ${possibleFilePath}`);
          return true;
        } catch {
          // File not in this subdirectory, continue searching
          continue;
        }
      }
    }
  } catch (searchError) {
    console.error('Error searching for file in subdirectories:', searchError);
  }
  
  console.warn(`⚠️ Could not find or delete file: ${filename}`);
  return false;
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = params

    // Get resume details before deletion
    const resume = await prisma.resume.findUnique({
      where: { id },
      include: { 
        user: true,
        candidate: {
          include: {
            addedBy: true
          }
        }
      }
    })

    if (!resume) {
      return NextResponse.json(
        { message: 'Resume not found' },
        { status: 404 }
      )
    }

    // Check permissions
    let canDelete = false;
    
    if (session) {
      // User can delete their own resumes
      if (resume.userId === session.user.id) {
        canDelete = true;
      }
      
      // FIXED: Allow deletion of unmapped resumes by any recruiter
      if (!resume.userId && !resume.candidateId && session.user.role === 'RECRUITER') {
        canDelete = true;
      }
      
      // Recruiters can delete resumes for candidates they manage
      if (session.user.role === 'RECRUITER' && resume.candidateId) {
        const recruiterProfile = await prisma.recruiter.findUnique({
          where: { userId: session.user.id }
        });
        
        if (recruiterProfile?.isActive) {
          // Check if this recruiter added the candidate or is an admin
          if (resume.candidate.addedById === session.user.id) {
            canDelete = true;
          } else if (recruiterProfile.recruiterType === 'ADMIN') {
            // Admin recruiters can delete resumes from their team members
            const teamMember = await prisma.recruiter.findFirst({
              where: {
                userId: resume.candidate.addedById,
                OR: [
                  { adminId: session.user.id },
                  { userId: session.user.id }
                ],
                isActive: true
              }
            });
            if (teamMember) {
              canDelete = true;
            }
          }
        }
      }
    }
    
    if (!canDelete) {
      return NextResponse.json(
        { message: 'Permission denied' },
        { status: 403 }
      )
    }

    // Delete file from filesystem using improved search method
    const fileDeleted = await findAndDeleteResumeFile(resume.filename, resume.url);
    
    if (!fileDeleted) {
      console.warn(`Could not delete physical file for resume ${id}, but proceeding with database deletion`);
    }

    // If this was the primary resume, make another one primary
    if (resume.isPrimary) {
      const whereClause = resume.userId 
        ? { userId: resume.userId, id: { not: id } }
        : resume.candidateId 
        ? { candidateId: resume.candidateId, id: { not: id } }
        : null;
        
      if (whereClause) {
        const nextResume = await prisma.resume.findFirst({
          where: whereClause,
          orderBy: { createdAt: 'desc' }
        })

        if (nextResume) {
          await prisma.resume.update({
            where: { id: nextResume.id },
            data: { isPrimary: true }
          })
          console.log(`Set resume ${nextResume.id} as new primary resume`);
        }
      }
    }

    // Delete resume record from database
    await prisma.resume.delete({
      where: { id }
    })

    // Create notification for successful deletion
    if (session && (resume.candidateId || (!resume.userId && !resume.candidateId))) {
      await prisma.notification.create({
        data: {
          title: 'Resume Deleted',
          message: `Resume "${resume.title || resume.originalName}" has been deleted successfully`,
          type: 'INFO',
          receiverId: session.user.id
        }
      }).catch(notificationError => {
        console.warn('Could not create deletion notification:', notificationError);
      });
    }

    console.log(`✅ Resume ${id} deleted successfully`);

    return NextResponse.json({
      message: 'Resume deleted successfully',
      fileDeleted,
      resumeInfo: {
        title: resume.title,
        originalName: resume.originalName,
        wasUnmapped: !resume.userId && !resume.candidateId,
        wasInSubdirectory: resume.url.includes('/')
      }
    })

  } catch (error) {
    console.error('Resume deletion error:', error)
    return NextResponse.json(
      { message: 'Failed to delete resume', details: error.message },
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