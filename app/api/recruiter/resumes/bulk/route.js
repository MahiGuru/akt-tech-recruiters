import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../(client)/lib/auth'
import { prisma } from '../../../../(client)/lib/prisma'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { operations } = body

    if (!operations || !Array.isArray(operations)) {
      return NextResponse.json(
        { message: 'Operations array is required' },
        { status: 400 }
      )
    }

    const results = []
    let successCount = 0
    let errorCount = 0

    // Process each operation
    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'map':
            await mapResumeToCandidate(operation.resumeId, operation.candidateId, session.user.id)
            results.push({
              type: 'map',
              resumeId: operation.resumeId,
              candidateId: operation.candidateId,
              success: true
            })
            successCount++
            break

          case 'unmap':
            await unmapResume(operation.resumeId, session.user.id)
            results.push({
              type: 'unmap',
              resumeId: operation.resumeId,
              success: true
            })
            successCount++
            break

          case 'delete':
            await deleteResume(operation.resumeId, session.user.id)
            results.push({
              type: 'delete',
              resumeId: operation.resumeId,
              success: true
            })
            successCount++
            break

          default:
            throw new Error(`Unknown operation type: ${operation.type}`)
        }
      } catch (error) {
        console.error(`Bulk operation error:`, error)
        results.push({
          ...operation,
          success: false,
          error: error.message
        })
        errorCount++
      }
    }

    // Create summary notification
    await prisma.notification.create({
      data: {
        title: 'Bulk Resume Operations Completed',
        message: `Completed ${successCount} successful operations, ${errorCount} errors`,
        type: successCount > 0 ? 'SUCCESS' : 'WARNING',
        receiverId: session.user.id
      }
    })

    return NextResponse.json({
      message: 'Bulk operations completed',
      summary: {
        total: operations.length,
        successful: successCount,
        errors: errorCount
      },
      results
    })

  } catch (error) {
    console.error('Bulk operations error:', error)
    return NextResponse.json(
      { message: 'Bulk operations failed' },
      { status: 500 }
    )
  }
}



// Helper functions
async function mapResumeToCandidate(resumeId, candidateId, recruiterId) {
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId }
    })
  
    if (!resume) {
      throw new Error('Resume not found')
    }
  
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        addedById: recruiterId
      }
    })
  
    if (!candidate) {
      throw new Error('Candidate not found or access denied')
    }
  
    await prisma.resume.update({
      where: { id: resumeId },
      data: { candidateId }
    })
  }
  
  async function unmapResume(resumeId, recruiterId) {
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        candidate: {
          select: { addedById: true }
        }
      }
    })
  
    if (!resume) {
      throw new Error('Resume not found')
    }
  
    if (!resume.candidateId) {
      throw new Error('Resume is not mapped to any candidate')
    }
  
    if (resume.candidate.addedById !== recruiterId) {
      throw new Error('Cannot unmap resume from candidate you do not manage')
    }
  
    await prisma.resume.update({
      where: { id: resumeId },
      data: { candidateId: null }
    })
  }
  
  async function deleteResume(resumeId, recruiterId) {
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        candidate: {
          select: { addedById: true }
        }
      }
    })
  
    if (!resume) {
      throw new Error('Resume not found')
    }
  
    const canDelete = resume.candidateId && resume.candidate.addedById === recruiterId
  
    if (!canDelete) {
      throw new Error('Cannot delete this resume - insufficient permissions')
    }
  
    // Delete file if exists
    try {
      const fs = require('fs')
      const path = require('path')
      const filepath = path.join(process.cwd(), 'public', resume.url)
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
      }
    } catch (fileError) {
      console.warn('Could not delete resume file:', fileError)
    }
  
    await prisma.resume.delete({
      where: { id: resumeId }
    })
  }