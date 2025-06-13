import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../(client)/lib/auth'
import { prisma } from '../../../(client)/lib/prisma'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a recruiter
    if (session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Access denied. Recruiter role required.' },
        { status: 403 }
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const isRead = searchParams.get('isRead')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause for notifications received by this user
    let whereClause = {
      receiverId: session.user.id
    }

    if (isRead !== null) {
      whereClause.isRead = isRead === 'true'
    }

    if (type) {
      whereClause.type = type
    }

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: [
        { isRead: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    // Get total count and unread count
    const totalCount = await prisma.notification.count({
      where: { receiverId: session.user.id }
    })

    const unreadCount = await prisma.notification.count({
      where: {
        receiverId: session.user.id,
        isRead: false
      }
    })

    return NextResponse.json({
      notifications,
      pagination: {
        total: totalCount,
        unread: unreadCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
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

    const body = await request.json()
    const { title, message, type = 'INFO', receiverId } = body

    if (!title || !message) {
      return NextResponse.json(
        { message: 'Title and message are required' },
        { status: 400 }
      )
    }

    // Validate notification type
    const validTypes = ['INFO', 'WARNING', 'SUCCESS', 'ERROR', 'APPROVAL_REQUEST']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { message: 'Invalid notification type' },
        { status: 400 }
      )
    }

    let targetReceiverId = receiverId

    // If no specific receiver, send to admin recruiter
    if (!targetReceiverId) {
      // Find admin recruiter
      const adminRecruiter = await prisma.recruiter.findFirst({
        where: {
          recruiterType: 'ADMIN',
          isActive: true
        },
        include: {
          user: {
            select: { id: true }
          }
        }
      })

      if (!adminRecruiter) {
        return NextResponse.json(
          { message: 'No admin recruiter found to send notification to' },
          { status: 404 }
        )
      }

      targetReceiverId = adminRecruiter.user.id
    }

    // Verify receiver exists and is a recruiter
    const receiver = await prisma.user.findUnique({
      where: { id: targetReceiverId },
      select: { 
        id: true, 
        role: true,
        recruiterProfile: {
          select: { isActive: true }
        }
      }
    })

    if (!receiver) {
      return NextResponse.json(
        { message: 'Receiver not found' },
        { status: 404 }
      )
    }

    if (receiver.role !== 'RECRUITER' || !receiver.recruiterProfile?.isActive) {
      return NextResponse.json(
        { message: 'Receiver must be an active recruiter' },
        { status: 400 }
      )
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        senderId: session.user.id,
        receiverId: targetReceiverId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Notification sent successfully',
      notification
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { notificationId, isRead = true } = body

    if (!notificationId) {
      return NextResponse.json(
        { message: 'Notification ID is required' },
        { status: 400 }
      )
    }

    // Update notification (only if user is the receiver)
    const updatedNotification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        receiverId: session.user.id
      },
      data: {
        isRead
      }
    })

    if (updatedNotification.count === 0) {
      return NextResponse.json(
        { message: 'Notification not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Notification updated successfully'
    })

  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Mark all notifications as read
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'RECRUITER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Mark all unread notifications as read for this user
    const updatedNotifications = await prisma.notification.updateMany({
      where: {
        receiverId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({
      message: 'All notifications marked as read',
      updatedCount: updatedNotifications.count
    })

  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}