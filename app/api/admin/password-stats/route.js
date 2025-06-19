// app/api/admin/password-stats/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../(client)/lib/auth'
import { prisma } from '../../../(client)/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and is an admin recruiter
    if (!session || !session.user || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const recruiterProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id }
    })

    if (!recruiterProfile || recruiterProfile.recruiterType !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get statistics
    const [
      totalUsers,
      usersWithPasswords,
      activeResetTokens,
      expiredTokens,
      recentResets
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Users with passwords (not OAuth only)
      prisma.user.count({
        where: {
          password: { not: null }
        }
      }),
      
      // Active (valid, unused) reset tokens
      prisma.passwordResetToken.count({
        where: {
          used: false,
          expires: { gt: new Date() }
        }
      }),
      
      // Expired tokens that need cleanup
      prisma.passwordResetToken.count({
        where: {
          OR: [
            { expires: { lt: new Date() } },
            { used: true }
          ]
        }
      }),
      
      // Recent password resets (last 24 hours)
      prisma.passwordResetToken.count({
        where: {
          used: true,
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    // Get active reset tokens with user info
    const tokens = await prisma.passwordResetToken.findMany({
      where: {
        used: false,
        expires: { gt: new Date() }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to recent 20 tokens
    })

    return NextResponse.json({
      stats: {
        totalUsers,
        usersWithPasswords,
        activeResetTokens,
        expiredTokens,
        recentResets
      },
      tokens
    })

  } catch (error) {
    console.error('Error fetching password stats:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// app/api/admin/password-activity/route.js
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const recruiterProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id }
    })

    if (!recruiterProfile || recruiterProfile.recruiterType !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get recent password activity (last 7 days)
    const recentActivity = await prisma.passwordResetToken.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to 50 recent activities
    })

    // Format activity data
    const activity = recentActivity.map(token => ({
      type: token.used ? 'reset' : 'requested',
      description: token.used 
        ? 'Password reset completed' 
        : 'Password reset requested',
      userEmail: token.user.email,
      userName: token.user.name,
      timestamp: token.used ? token.updatedAt : token.createdAt,
      tokenId: token.id
    }))

    return NextResponse.json({ activity })

  } catch (error) {
    console.error('Error fetching password activity:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}