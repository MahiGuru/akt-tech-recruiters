// app/api/admin/revoke-token/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../(client)/lib/auth'
import { prisma } from '../../../(client)/lib/prisma'

export async function POST(request) {
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

    const { tokenId } = await request.json()

    if (!tokenId) {
      return NextResponse.json(
        { message: 'Token ID is required' },
        { status: 400 }
      )
    }

    // Mark token as used (effectively revoking it)
    const token = await prisma.passwordResetToken.update({
      where: { id: tokenId },
      data: { used: true },
      include: {
        user: {
          select: { email: true }
        }
      }
    })

    console.log(`Admin ${session.user.email} revoked password reset token for ${token.user.email}`)

    return NextResponse.json({
      message: 'Token revoked successfully',
      tokenId,
      userEmail: token.user.email
    })

  } catch (error) {
    console.error('Error revoking token:', error)
    return NextResponse.json(
      { message: 'Failed to revoke token' },
      { status: 500 }
    )
  }
}

// app/api/admin/bulk-password-reset/route.js  
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

    // Get all users with passwords (exclude OAuth-only users)
    const users = await prisma.user.findMany({
      where: {
        password: { not: null },
        email: { not: null }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    let sentCount = 0
    const errors = []

    // Send password reset emails in batches to avoid overwhelming email service
    const batchSize = 10
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (user) => {
        try {
          // Generate reset token
          const resetToken = crypto.randomBytes(32).toString('hex')
          const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

          // Clean up existing tokens
          await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id, used: false }
          })

          // Create new token
          await prisma.passwordResetToken.create({
            data: {
              token: resetToken,
              userId: user.id,
              expires,
              used: false
            }
          })

          // Send email
          const emailResult = await sendPasswordResetEmail(
            user.email,
            resetToken,
            user.name || 'User'
          )

          if (emailResult.success) {
            sentCount++
          } else {
            errors.push(`Failed to send to ${user.email}: ${emailResult.error}`)
          }

        } catch (error) {
          errors.push(`Error processing ${user.email}: ${error.message}`)
        }
      }))

      // Small delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`Admin ${session.user.email} initiated bulk password reset for ${sentCount} users`)

    return NextResponse.json({
      message: `Bulk password reset completed`,
      sent: sentCount,
      total: users.length,
      errors: errors.length > 0 ? errors : null
    })

  } catch (error) {
    console.error('Error with bulk password reset:', error)
    return NextResponse.json(
      { message: 'Bulk password reset failed' },
      { status: 500 }
    )
  }
}

// app/api/admin/password-activity/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../(client)/lib/auth'
import { prisma } from '../../../(client)/lib/prisma'

export async function GET() {
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
      take: 50
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

// app/api/admin/password-policy/route.js
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return current password policy
    const policy = {
      minLength: 6,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
      maxAge: null, // No password expiration
      preventReuse: false, // Don't prevent password reuse
      lockoutAttempts: 5,
      lockoutDuration: 15 * 60 * 1000 // 15 minutes
    }

    return NextResponse.json({ policy })

  } catch (error) {
    console.error('Error fetching password policy:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
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

    const { policy } = await request.json()

    // Validate policy settings
    if (policy.minLength < 4 || policy.minLength > 50) {
      return NextResponse.json(
        { message: 'Minimum length must be between 4 and 50 characters' },
        { status: 400 }
      )
    }

    // In a production app, you'd save this to database or config
    // For now, just return success
    console.log(`Admin ${session.user.email} updated password policy:`, policy)

    return NextResponse.json({
      message: 'Password policy updated successfully',
      policy
    })

  } catch (error) {
    console.error('Error updating password policy:', error)
    return NextResponse.json(
      { message: 'Failed to update password policy' },
      { status: 500 }
    )
  }
}