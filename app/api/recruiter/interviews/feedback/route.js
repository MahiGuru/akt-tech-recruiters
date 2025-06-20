// app/api/recruiter/interviews/feedback/route.js - FIXED VERSION
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../(client)/lib/auth'
import { prisma } from '../../../../(client)/lib/prisma'

// Helper function to get team member IDs for admin
async function getTeamMemberIds(adminUserId) {
  const visited = new Set()
  const toVisit = [adminId]

  while (toVisit.length > 0) {
    const currentAdminId = toVisit.pop()

    if (!visited.has(currentAdminId)) {
      visited.add(currentAdminId)

      const team = await prisma.recruiter.findMany({
        where: { adminId: currentAdminId, isActive: true },
        select: { userId: true }
      })

      team.forEach(member => {
        if (!visited.has(member.userId)) {
          toVisit.push(member.userId)
        }
      })
    }
  }

  return Array.from(visited)
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
    const { 
      interviewId,
      status = 'COMPLETED',
      outcome,
      overallRating,
      technicalRating,
      communicationRating,
      culturalFitRating,
      strengths,
      weaknesses,
      feedback,
      nextSteps,
      recommendations,
      wouldRecommendHiring
    } = body

    // FIXED: Better validation
    if (!interviewId) {
      return NextResponse.json(
        { message: 'Interview ID is required' },
        { status: 400 }
      )
    }

    if (!outcome) {
      return NextResponse.json(
        { message: 'Interview outcome is required' },
        { status: 400 }
      )
    }

    if (!feedback || feedback.trim() === '') {
      return NextResponse.json(
        { message: 'Feedback is required' },
        { status: 400 }
      )
    }

    // Validate outcome
    const validOutcomes = ['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR']
    if (!validOutcomes.includes(outcome)) {
      return NextResponse.json(
        { message: 'Invalid interview outcome. Must be one of: EXCELLENT, GOOD, AVERAGE, POOR' },
        { status: 400 }
      )
    }

    // FIXED: Better ratings validation - handle undefined and ensure they're numbers
    const ratings = [overallRating, technicalRating, communicationRating, culturalFitRating]
    const validRatings = ratings.filter(rating => rating !== undefined && rating !== null)
    
    if (validRatings.length > 0) {
      const invalidRatings = validRatings.filter(rating => {
        const num = Number(rating)
        return isNaN(num) || num < 1 || num > 5
      })
      
      if (invalidRatings.length > 0) {
        return NextResponse.json(
          { message: 'All ratings must be numbers between 1 and 5' },
          { status: 400 }
        )
      }
    }

    // FIXED: Validate hiring recommendation (can be null)
    if (wouldRecommendHiring !== null && wouldRecommendHiring !== undefined && typeof wouldRecommendHiring !== 'boolean') {
      return NextResponse.json(
        { message: 'Would recommend hiring must be true, false, or null' },
        { status: 400 }
      )
    }

    // Determine access scope
    const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
    let allowedRecruiterIds = [session.user.id]

    if (isAdmin) {
      allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    }

    // Verify interview access and that it's eligible for feedback
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        OR: [
          { scheduledById: { in: allowedRecruiterIds } }, // Scheduled by team
          { 
            candidate: {
              addedById: { in: allowedRecruiterIds }
            }
          } // For team candidates
        ]
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            addedById: true,
            status: true,
            addedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        scheduledBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!interview) {
      return NextResponse.json(
        { message: 'Interview not found or access denied' },
        { status: 404 }
      )
    }

    // Check if interview is past the scheduled time (eligible for feedback)
    const now = new Date()
    const interviewEndTime = new Date(interview.scheduledAt.getTime() + (interview.duration * 60 * 1000))
    
    if (interviewEndTime > now) {
      return NextResponse.json(
        { message: 'Cannot submit feedback for future interviews' },
        { status: 400 }
      )
    }

    // Check if feedback already exists
    if (interview.feedbackSubmitted) {
      return NextResponse.json(
        { message: 'Feedback has already been submitted for this interview' },
        { status: 400 }
      )
    }

    // FIXED: Prepare update data with proper type conversion
    const updateData = {
      status,
      outcome,
      feedback: feedback.trim(),
      feedbackSubmitted: true,
      feedbackSubmittedAt: now,
      feedbackSubmittedById: session.user.id
    }

    // Add optional fields only if they exist
    if (overallRating !== undefined && overallRating !== null) {
      updateData.overallRating = Number(overallRating)
    }
    if (technicalRating !== undefined && technicalRating !== null) {
      updateData.technicalRating = Number(technicalRating)
    }
    if (communicationRating !== undefined && communicationRating !== null) {
      updateData.communicationRating = Number(communicationRating)
    }
    if (culturalFitRating !== undefined && culturalFitRating !== null) {
      updateData.culturalFitRating = Number(culturalFitRating)
    }
    if (strengths && strengths.trim()) {
      updateData.strengths = strengths.trim()
    }
    if (weaknesses && weaknesses.trim()) {
      updateData.weaknesses = weaknesses.trim()
    }
    if (nextSteps && nextSteps.trim()) {
      updateData.nextSteps = nextSteps.trim()
    }
    if (recommendations && recommendations.trim()) {
      updateData.recommendations = recommendations.trim()
    }
    if (wouldRecommendHiring !== null && wouldRecommendHiring !== undefined) {
      updateData.wouldRecommendHiring = wouldRecommendHiring
    }

    // Update interview with feedback
    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: updateData,
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            addedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        scheduledBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        feedbackSubmitter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create notifications based on feedback outcome
    const notificationPromises = []

    // Notify the candidate's owner (if different from feedback submitter)
    if (interview.candidate.addedBy.id !== session.user.id) {
      const outcomeMessage = outcome === 'EXCELLENT' || outcome === 'GOOD' 
        ? `positive feedback (${outcome.toLowerCase()})` 
        : `feedback requiring attention (${outcome.toLowerCase()})`
      
      notificationPromises.push(
        prisma.notification.create({
          data: {
            title: 'Interview Feedback Submitted',
            message: `Feedback has been submitted for ${interview.candidate.name}'s interview: ${interview.title}. The interview received ${outcomeMessage}.`,
            type: outcome === 'EXCELLENT' || outcome === 'GOOD' ? 'SUCCESS' : 'WARNING',
            receiverId: interview.candidate.addedBy.id,
            senderId: session.user.id
          }
        })
      )
    }

    // Notify admin if major red flags (poor rating + not recommended)
    if (outcome === 'POOR' && wouldRecommendHiring === false && !isAdmin) {
      // Find admin to notify
      const adminRecruiter = await prisma.recruiter.findFirst({
        where: {
          recruiterType: 'ADMIN',
          isActive: true,
          OR: [
            { userId: { in: allowedRecruiterIds } }, // Same team admin
            { adminId: null } // Any admin if no specific team
          ]
        },
        include: {
          user: {
            select: { id: true }
          }
        }
      })

      if (adminRecruiter) {
        notificationPromises.push(
          prisma.notification.create({
            data: {
              title: 'Poor Interview Performance Alert',
              message: `${interview.candidate.name} received poor feedback in interview "${interview.title}" and is not recommended for hiring. Review may be needed.`,
              type: 'WARNING',
              receiverId: adminRecruiter.user.id,
              senderId: session.user.id
            }
          })
        )
      }
    }

    // Execute all notifications
    if (notificationPromises.length > 0) {
      await Promise.all(notificationPromises)
    }

    // Create activity log for excellent candidates
    if (outcome === 'EXCELLENT' && wouldRecommendHiring === true) {
      await prisma.notification.create({
        data: {
          title: 'Excellent Candidate Identified',
          message: `${interview.candidate.name} received excellent feedback and is highly recommended for hiring after "${interview.title}".`,
          type: 'SUCCESS',
          receiverId: session.user.id
        }
      })
    }

    return NextResponse.json({
      message: 'Interview feedback submitted successfully',
      interview: updatedInterview
    }, { status: 201 })

  } catch (error) {
    console.error('Error submitting interview feedback:', error)
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve feedback for an interview
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
    const interviewId = searchParams.get('interviewId')

    if (!interviewId) {
      return NextResponse.json(
        { message: 'Interview ID is required' },
        { status: 400 }
      )
    }

    // Determine access scope
    const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
    let allowedRecruiterIds = [session.user.id]

    if (isAdmin) {
      allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    }

    // Get interview with feedback
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        OR: [
          { scheduledById: { in: allowedRecruiterIds } },
          { 
            candidate: {
              addedById: { in: allowedRecruiterIds }
            }
          }
        ]
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        scheduledBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        feedbackSubmitter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!interview) {
      return NextResponse.json(
        { message: 'Interview not found or access denied' },
        { status: 404 }
      )
    }

    if (!interview.feedbackSubmitted) {
      return NextResponse.json(
        { message: 'No feedback submitted for this interview yet' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      interview: {
        id: interview.id,
        title: interview.title,
        scheduledAt: interview.scheduledAt,
        duration: interview.duration,
        status: interview.status,
        outcome: interview.outcome,
        overallRating: interview.overallRating,
        technicalRating: interview.technicalRating,
        communicationRating: interview.communicationRating,
        culturalFitRating: interview.culturalFitRating,
        strengths: interview.strengths,
        weaknesses: interview.weaknesses,
        feedback: interview.feedback,
        nextSteps: interview.nextSteps,
        recommendations: interview.recommendations,
        wouldRecommendHiring: interview.wouldRecommendHiring,
        feedbackSubmittedAt: interview.feedbackSubmittedAt,
        candidate: interview.candidate,
        scheduledBy: interview.scheduledBy,
        feedbackSubmitter: interview.feedbackSubmitter
      }
    })

  } catch (error) {
    console.error('Error fetching interview feedback:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}