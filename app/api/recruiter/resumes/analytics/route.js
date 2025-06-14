import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../(client)/lib/auth'
import { prisma } from '../../../../(client)/lib/prisma'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get resume analytics
    const totalResumes = await prisma.resume.count()
    
    const mappedResumes = await prisma.resume.count({
      where: {
        candidateId: { not: null },
        candidate: {
          addedById: session.user.id
        }
      }
    })

    const unmappedUserResumes = await prisma.resume.count({
      where: {
        userId: { not: null },
        candidateId: null
      }
    })

    const experienceDistribution = await prisma.resume.groupBy({
      by: ['experienceLevel'],
      where: {
        OR: [
          { userId: { not: null } },
          {
            candidateId: { not: null },
            candidate: { addedById: session.user.id }
          }
        ]
      },
      _count: { experienceLevel: true }
    })

    const candidateResumeStats = await prisma.candidate.findMany({
      where: { addedById: session.user.id },
      include: {
        _count: {
          select: { resumes: true }
        }
      }
    })

    const recentUploads = await prisma.resume.findMany({
      where: {
        OR: [
          { userId: { not: null } },
          {
            candidateId: { not: null },
            candidate: { addedById: session.user.id }
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { name: true, email: true }
        },
        candidate: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      summary: {
        totalResumes,
        mappedResumes,
        unmappedUserResumes,
        candidatesWithResumes: candidateResumeStats.filter(c => c._count.resumes > 0).length,
        candidatesWithoutResumes: candidateResumeStats.filter(c => c._count.resumes === 0).length
      },
      experienceDistribution: experienceDistribution.map(item => ({
        level: item.experienceLevel,
        count: item._count.experienceLevel
      })),
      candidateResumeStats: candidateResumeStats.map(candidate => ({
        candidateId: candidate.id,
        candidateName: candidate.name,
        resumeCount: candidate._count.resumes
      })),
      recentUploads: recentUploads.map(resume => ({
        id: resume.id,
        title: resume.title,
        experienceLevel: resume.experienceLevel,
        createdAt: resume.createdAt,
        ownerName: resume.candidateId ? resume.candidate?.name : resume.user?.name,
        ownerEmail: resume.candidateId ? resume.candidate?.email : resume.user?.email,
        ownerType: resume.candidateId ? 'candidate' : 'user'
      }))
    })

  } catch (error) {
    console.error('Error fetching resume analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}