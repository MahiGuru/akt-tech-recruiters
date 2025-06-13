import { NextResponse } from 'next/server'
import { prisma } from '../../../(client)/lib/prisma'

export async function POST(request) {
  try {
    console.log('Processing interview reminders...')
    
    // Find notifications scheduled to be sent now or in the past
    const now = new Date()
    const scheduledNotifications = await prisma.notification.findMany({
      where: {
        scheduledFor: {
          lte: now
        },
        type: 'INTERVIEW_REMINDER',
        isRead: false // Only unprocessed notifications
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    let processedCount = 0
    const results = []

    for (const notification of scheduledNotifications) {
      try {
        // Mark the notification as sent by updating it
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            scheduledFor: null, // Clear the scheduled time
            updatedAt: now
          }
        })

        // Here you could integrate with email/SMS services
        // For now, we'll just log and mark as processed
        console.log(`Interview reminder sent to ${notification.receiver.name}: ${notification.message}`)
        
        results.push({
          notificationId: notification.id,
          receiverId: notification.receiverId,
          receiverName: notification.receiver.name,
          message: notification.message,
          status: 'sent'
        })
        
        processedCount++
      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error)
        results.push({
          notificationId: notification.id,
          receiverId: notification.receiverId,
          status: 'failed',
          error: error.message
        })
      }
    }

    console.log(`Processed ${processedCount} interview reminders`)

    return NextResponse.json({
      message: `Processed ${processedCount} interview reminders`,
      processed: processedCount,
      total: scheduledNotifications.length,
      results
    })

  } catch (error) {
    console.error('Error processing interview reminders:', error)
    return NextResponse.json(
      { message: 'Failed to process reminders', error: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to check upcoming reminders
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '1')
    
    const fromTime = new Date()
    const toTime = new Date(Date.now() + (hours * 60 * 60 * 1000))
    
    const upcomingReminders = await prisma.notification.findMany({
      where: {
        scheduledFor: {
          gte: fromTime,
          lte: toTime
        },
        type: 'INTERVIEW_REMINDER'
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    })

    return NextResponse.json({
      upcomingReminders: upcomingReminders.map(notification => ({
        id: notification.id,
        scheduledFor: notification.scheduledFor,
        receiverName: notification.receiver.name,
        message: notification.message,
        interviewId: notification.interviewId
      })),
      count: upcomingReminders.length
    })

  } catch (error) {
    console.error('Error fetching upcoming reminders:', error)
    return NextResponse.json(
      { message: 'Failed to fetch upcoming reminders' },
      { status: 500 }
    )
  }
}