// app/api/recruiter/admin/candidates/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../(client)/lib/auth';
import { prisma } from '../../../../(client)/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Check if user is admin recruiter
    const adminProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id },
    });

    if (!adminProfile || adminProfile.recruiterType !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 },
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const recruiterId = searchParams.get('recruiterId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get all team members (recruiters managed by this admin or the admin themselves)
    async function getAllTeamUserIds(adminId) {
      const visited = new Set();
      const toVisit = [adminId];
    
      while (toVisit.length > 0) {
        const currentAdminId = toVisit.pop();
    
        if (!visited.has(currentAdminId)) {
          visited.add(currentAdminId);
    
          const team = await prisma.recruiter.findMany({
            where: { adminId: currentAdminId, isActive: true },
            select: { userId: true },
          });
    
          team.forEach(member => {
            if (!visited.has(member.userId)) {
              toVisit.push(member.userId);
            }
          });
        }
      }
    
      return Array.from(visited);
    }

    const teamUserIds = await getAllTeamUserIds(session.user.id);

    // Build where clause for candidates
    const whereClause = {
      addedById: { in: teamUserIds },
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { skills: { has: search } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (recruiterId) {
      whereClause.addedById = recruiterId;
    }

    // Fetch all candidates from team members
    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      include: {
        resumes: {
          where: { isActive: true },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'desc' },
          ],
        },
        applications: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                company: true,
                isActive: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        interviews: {
          include: {
            scheduledBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { scheduledAt: 'asc' },
        },
        addedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            recruiterProfile: {
              select: {
                recruiterType: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.candidate.count({
      where: whereClause,
    });

    // Get status distribution across all team candidates
    const statusStats = await prisma.candidate.groupBy({
      by: ['status'],
      where: { addedById: { in: teamUserIds } },
      _count: { status: true },
    });

    // Get recruiter distribution (candidates per recruiter)
    const recruiterStats = await prisma.candidate.groupBy({
      by: ['addedById'],
      where: { addedById: { in: teamUserIds } },
      _count: { addedById: true },
    });

    // Get recruiter names for stats
    const recruiterStatsWithNames = await Promise.all(
      recruiterStats.map(async (stat) => {
        const user = await prisma.user.findUnique({
          where: { id: stat.addedById },
          select: { name: true, email: true },
        });
        return {
          recruiterId: stat.addedById,
          recruiterName: user?.name || 'Unknown',
          recruiterEmail: user?.email || '',
          candidateCount: stat._count.addedById,
        };
      }),
    );

    // Calculate team performance metrics
    const totalCandidates = candidates.length;
    const activeCandidates = candidates.filter(c => c.status === 'ACTIVE').length;
    const placedCandidates = candidates.filter(c => c.status === 'PLACED').length;
    const candidatesWithResumes = candidates.filter(c => c.resumes.length > 0).length;
    const candidatesWithApplications = candidates.filter(c => c.applications.length > 0).length;

    return NextResponse.json({
      candidates,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      stats: {
        total: totalCandidates,
        active: activeCandidates,
        placed: placedCandidates,
        placementRate: totalCandidates > 0 ? Math.round((placedCandidates / totalCandidates) * 100) : 0,
        withResumes: candidatesWithResumes,
        withApplications: candidatesWithApplications,
        statusDistribution: statusStats.map(item => ({
          status: item.status,
          count: item._count.status,
        })),
        recruiterDistribution: recruiterStatsWithNames,
      },
      teamInfo: {
        totalRecruiters: teamUserIds.length,
        teamUserIds,
      },
    });

  } catch (error) {
    console.error('Error fetching admin candidates:', error);
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 },
    );
  }
}