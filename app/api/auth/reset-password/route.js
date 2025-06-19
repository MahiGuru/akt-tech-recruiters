// app/api/auth/reset-password/route.js
import { NextResponse } from 'next/server'
import { prisma } from '../../../(client)/lib/prisma'
import { sendPasswordChangeConfirmation } from '../../../(client)/lib/email'
import bcrypt from 'bcrypt'

export async function POST(request) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Find and validate reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!resetToken) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      })

      return NextResponse.json(
        { message: 'Reset token has expired. Please request a new password reset.' },
        { status: 400 }
      )
    }

    // Check if token is already used
    if (resetToken.used) {
      return NextResponse.json(
        { message: 'Reset token has already been used' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password and mark token as used in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      })

      // Mark token as used
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })

      // Clean up any other unused tokens for this user
      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          used: false,
          id: { not: resetToken.id }
        }
      })
    })

    // Send confirmation email
    try {
      await sendPasswordChangeConfirmation(
        resetToken.user.email,
        resetToken.user.name || 'User'
      )
    } catch (emailError) {
      // Don't fail the password reset if email fails
      console.error('Failed to send password change confirmation:', emailError)
    }

    return NextResponse.json(
      { 
        message: 'Password has been reset successfully. You can now sign in with your new password.',
        success: true 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { message: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}

// GET route to validate reset token
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required', valid: false },
        { status: 400 }
      )
    }

    // Check if token exists and is valid
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true,
        expires: true,
        used: true,
        user: {
          select: {
            email: true
          }
        }
      }
    })

    if (!resetToken) {
      return NextResponse.json(
        { message: 'Invalid reset token', valid: false },
        { status: 400 }
      )
    }

    if (resetToken.expires < new Date()) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({
        where: { token }
      })

      return NextResponse.json(
        { message: 'Reset token has expired', valid: false },
        { status: 400 }
      )
    }

    if (resetToken.used) {
      return NextResponse.json(
        { message: 'Reset token has already been used', valid: false },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Token is valid',
        valid: true,
        email: resetToken.user.email
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { message: 'Internal server error', valid: false },
      { status: 500 }
    )
  }
}