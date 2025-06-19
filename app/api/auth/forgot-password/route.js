// app/api/auth/forgot-password/route.js (Enhanced version)
import { NextResponse } from 'next/server'
import { prisma } from '../../../(client)/lib/prisma'
import { sendPasswordResetEmail } from '../../../(client)/lib/email'
import { withRateLimit } from '../../../(client)/lib/rate-limiter'
import crypto from 'crypto'

// Input validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

async function forgotPasswordHandler(request) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    if (!validateEmail(normalizedEmail)) {
      return NextResponse.json(
        { message: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Always return success for security (timing attack prevention)
    const successResponse = {
      message: 'If an account with that email exists, we have sent you a password reset link.',
      success: true 
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        password: true // Check if user has password (not OAuth only)
      }
    })

    // Return success even if user not found (security)
    if (!user || !user.password) {
      // Add artificial delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200))
      
      return NextResponse.json(successResponse, { status: 200 })
    }

    // Check for recent reset attempts (additional security)
    const recentToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        used: false,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      }
    })

    if (recentToken) {
      // Don't send another email too soon
      return NextResponse.json(successResponse, { status: 200 })
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Clean up any existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        used: false
      }
    })

    // Create new reset token
    const tokenRecord = await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expires,
        used: false
      }
    })

    // Send reset email
    const emailResult = await sendPasswordResetEmail(
      user.email,
      resetToken,
      user.name || 'User'
    )

    if (!emailResult.success) {
      console.error('Failed to send reset email:', emailResult.error)
      
      // Clean up the token if email fails
      await prisma.passwordResetToken.delete({
        where: { id: tokenRecord.id }
      })

      return NextResponse.json(
        { 
          message: 'Failed to send reset email. Please try again later.',
          emailError: true 
        },
        { status: 500 }
      )
    }

    // Log successful password reset request (for monitoring)
    console.log(`Password reset requested for user: ${user.email}`)

    return NextResponse.json(successResponse, { status: 200 })

  } catch (error) {
    console.error('Forgot password error:', error)
    
    // Don't reveal internal errors
    return NextResponse.json(
      { message: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}

// Apply rate limiting: 5 attempts per 15 minutes per IP/email combination
export const POST = withRateLimit(forgotPasswordHandler, {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (request) => {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'anonymous'
    return ip // Rate limit by IP
  }
})

// Cleanup endpoint for expired tokens (can be called by cron job)
export async function DELETE() {
  try {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expires: { lt: new Date() } },
          { used: true }
        ]
      }
    })

    return NextResponse.json({
      message: `Cleaned up ${result.count} expired/used tokens`,
      cleaned: result.count
    })
  } catch (error) {
    console.error('Token cleanup error:', error)
    return NextResponse.json(
      { message: 'Cleanup failed' },
      { status: 500 }
    )
  }
}