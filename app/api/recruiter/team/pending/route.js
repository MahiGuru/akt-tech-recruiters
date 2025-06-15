// app/api/recruiter/team/pending/route.js
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

    // Check if user is admin recruiter
    const adminProfile = await prisma.recruiter.findUnique({
      where: { userId: session.user.id }
    })

    if (!adminProfile || adminProfile.recruiterType !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required to view pending requests' },
        { status: 403 }
      )
    }

    // Get pending recruiter approval requests
    // These are recruiters who are inactive and have requested this admin
    const pendingRequests = await prisma.recruiter.findMany({
      where: {
        isActive: false,
        adminId: session.user.id // Requested this admin for approval
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Also get requests where adminId is null (new requests without specific admin)
    const generalRequests = await prisma.recruiter.findMany({
      where: {
        isActive: false,
        adminId: null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const allRequests = [...pendingRequests, ...generalRequests]

    return NextResponse.json({
      requests: allRequests,
      summary: {
        total: allRequests.length,
        directRequests: pendingRequests.length,
        generalRequests: generalRequests.length
      }
    })

  } catch (error) {
    console.error('Error fetching pending requests:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}