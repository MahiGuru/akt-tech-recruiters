// app/api/recruiter/placements/[candidateId]/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../(client)/lib/auth'
import { prisma } from '../../../../(client)/lib/prisma'

// Helper function to get team member IDs for admin
async function getTeamMemberIds(adminUserId) {
  const teamMembers = await prisma.recruiter.findMany({
    where: {
      OR: [
        { adminId: adminUserId }, // Team members
        { userId: adminUserId, recruiterType: 'ADMIN' } // Current admin
      ],
      isActive: true
    },
    select: { userId: true }
  })
  return teamMembers.map(member => member.userId)
}

// GET - Fetch placement details for a candidate
export async function GET(request, { params }) {
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

    const { candidateId } = params

    // Determine access scope
    const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
    let allowedRecruiterIds = [session.user.id]

    if (isAdmin) {
      allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    }

    // Verify candidate access
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        addedById: { in: allowedRecruiterIds }
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { message: 'Candidate not found or access denied' },
        { status: 404 }
      )
    }

    // Get placement details
    const placement = await prisma.placement.findUnique({
      where: { candidateId },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      placement,
      candidate,
      hasPlacement: !!placement
    })

  } catch (error) {
    console.error('Error fetching placement:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new placement
export async function POST(request, { params }) {
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

    const { candidateId } = params
    const body = await request.json()

    // Validate required fields
    const { salary, clientCompany } = body
    if (!salary || !clientCompany) {
      return NextResponse.json(
        { message: 'Salary, client company, and job title are required' },
        { status: 400 }
      )
    }

    // Determine access scope
    const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
    let allowedRecruiterIds = [session.user.id]

    if (isAdmin) {
      allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    }

    // Verify candidate access
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        addedById: { in: allowedRecruiterIds }
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { message: 'Candidate not found or access denied' },
        { status: 404 }
      )
    }

    // Check if placement already exists
    const existingPlacement = await prisma.placement.findUnique({
      where: { candidateId }
    })

    if (existingPlacement) {
      return NextResponse.json(
        { message: 'Placement already exists for this candidate' },
        { status: 400 }
      )
    }

    // Create placement in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create placement
      const placement = await tx.placement.create({
        data: {
          candidateId,
          createdById: session.user.id,
          updatedById: session.user.id,
          
          // Compensation
          salary: parseFloat(salary),
          currency: body.currency || 'USD',
          salaryType: body.salaryType || 'ANNUAL',
          bonus: body.bonus ? parseFloat(body.bonus) : null,
          commission: body.commission ? parseFloat(body.commission) : null,
          benefits: body.benefits || [],
          
          // Client details
          clientCompany,
          clientContactName: body.clientContactName || null,
          clientContactEmail: body.clientContactEmail || null,
          clientContactPhone: body.clientContactPhone || null,
          clientAddress: body.clientAddress || null,
          clientIndustry: body.clientIndustry || null,
          
          // Vendor details
          vendorCompany: body.vendorCompany || null,
          vendorContactName: body.vendorContactName || null,
          vendorContactEmail: body.vendorContactEmail || null,
          vendorContactPhone: body.vendorContactPhone || null,
          vendorRate: body.vendorRate ? parseFloat(body.vendorRate) : null,
          vendorCommission: body.vendorCommission ? parseFloat(body.vendorCommission) : null,
          
          // Account details
          accountManager: body.accountManager || null,
          placementFee: body.placementFee ? parseFloat(body.placementFee) : null,
          feeType: body.feeType || 'PERCENTAGE',
          feePercentage: body.feePercentage ? parseFloat(body.feePercentage) : null,
          paymentTerms: body.paymentTerms || null,
          
          // Placement info
          jobTitle: body.jobTitle || null,
          startDate: body.startDate ? new Date(body.startDate) : null,
          endDate: body.endDate ? new Date(body.endDate) : null,
          placementType: body.placementType || 'PERMANENT',
          workLocation: body.workLocation || null,
          workType: body.workType || 'FULL_TIME',
          reportingManager: body.reportingManager || null,
          
          // Additional
          notes: body.notes || null,
          milestones: body.milestones || []
        },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Update candidate status to PLACED if not already
      if (candidate.status !== 'PLACED') {
        await tx.candidate.update({
          where: { id: candidateId },
          data: { status: 'PLACED' }
        })
      }

      return placement
    })

    // Create notification for team members
    if (isAdmin && candidate.addedById !== session.user.id) {
      await prisma.notification.create({
        data: {
          title: 'Candidate Placement Created',
          message: `Admin created placement details for ${candidate.name} at ${clientCompany}`,
          type: 'SUCCESS',
          receiverId: candidate.addedById,
          senderId: session.user.id
        }
      })
    }

    return NextResponse.json({
      message: 'Placement created successfully',
      placement: result
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating placement:', error)
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update existing placement
export async function PUT(request, { params }) {
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

    const { candidateId } = params
    const body = await request.json()

    // Determine access scope
    const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
    let allowedRecruiterIds = [session.user.id]

    if (isAdmin) {
      allowedRecruiterIds = await getTeamMemberIds(session.user.id)
    }

    // Verify candidate and placement access
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        addedById: { in: allowedRecruiterIds }
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { message: 'Candidate not found or access denied' },
        { status: 404 }
      )
    }

    const existingPlacement = await prisma.placement.findUnique({
      where: { candidateId }
    })

    if (!existingPlacement) {
      return NextResponse.json(
        { message: 'Placement not found' },
        { status: 404 }
      )
    }

    // Check if user can edit this placement
    const canEdit = isAdmin || existingPlacement.createdById === session.user.id

    if (!canEdit) {
      return NextResponse.json(
        { message: 'You do not have permission to edit this placement' },
        { status: 403 }
      )
    }

    // Update placement
    const updatedPlacement = await prisma.placement.update({
      where: { candidateId },
      data: {
        updatedById: session.user.id,
        
        // Update fields only if provided
        ...(body.salary && { salary: parseFloat(body.salary) }),
        ...(body.currency && { currency: body.currency }),
        ...(body.salaryType && { salaryType: body.salaryType }),
        ...(body.bonus !== undefined && { bonus: body.bonus ? parseFloat(body.bonus) : null }),
        ...(body.commission !== undefined && { commission: body.commission ? parseFloat(body.commission) : null }),
        ...(body.benefits !== undefined && { benefits: body.benefits }),
        
        // Client details
        ...(body.clientCompany && { clientCompany: body.clientCompany }),
        ...(body.clientContactName !== undefined && { clientContactName: body.clientContactName }),
        ...(body.clientContactEmail !== undefined && { clientContactEmail: body.clientContactEmail }),
        ...(body.clientContactPhone !== undefined && { clientContactPhone: body.clientContactPhone }),
        ...(body.clientAddress !== undefined && { clientAddress: body.clientAddress }),
        ...(body.clientIndustry !== undefined && { clientIndustry: body.clientIndustry }),
        
        // Vendor details
        ...(body.vendorCompany !== undefined && { vendorCompany: body.vendorCompany }),
        ...(body.vendorContactName !== undefined && { vendorContactName: body.vendorContactName }),
        ...(body.vendorContactEmail !== undefined && { vendorContactEmail: body.vendorContactEmail }),
        ...(body.vendorContactPhone !== undefined && { vendorContactPhone: body.vendorContactPhone }),
        ...(body.vendorRate !== undefined && { vendorRate: body.vendorRate ? parseFloat(body.vendorRate) : null }),
        ...(body.vendorCommission !== undefined && { vendorCommission: body.vendorCommission ? parseFloat(body.vendorCommission) : null }),
        
        // Account details
        ...(body.accountManager !== undefined && { accountManager: body.accountManager }),
        ...(body.placementFee !== undefined && { placementFee: body.placementFee ? parseFloat(body.placementFee) : null }),
        ...(body.feeType && { feeType: body.feeType }),
        ...(body.feePercentage !== undefined && { feePercentage: body.feePercentage ? parseFloat(body.feePercentage) : null }),
        ...(body.paymentTerms !== undefined && { paymentTerms: body.paymentTerms }),
        
        // Placement info
        ...(body.jobTitle && { jobTitle: body.jobTitle }),
        ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        ...(body.placementType && { placementType: body.placementType }),
        ...(body.workLocation !== undefined && { workLocation: body.workLocation }),
        ...(body.workType && { workType: body.workType }),
        ...(body.reportingManager !== undefined && { reportingManager: body.reportingManager }),
        
        // Additional
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.milestones !== undefined && { milestones: body.milestones })
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Placement updated successfully',
      placement: updatedPlacement
    })

  } catch (error) {
    console.error('Error updating placement:', error)
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Remove placement
export async function DELETE(request, { params }) {
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

    const { candidateId } = params

    // Only admins can delete placements
    if (recruiterProfile.recruiterType !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required to delete placements' },
        { status: 403 }
      )
    }

    // Get team member IDs
    const allowedRecruiterIds = await getTeamMemberIds(session.user.id)

    // Verify candidate access
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        addedById: { in: allowedRecruiterIds }
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { message: 'Candidate not found or access denied' },
        { status: 404 }
      )
    }

    const placement = await prisma.placement.findUnique({
      where: { candidateId }
    })

    if (!placement) {
      return NextResponse.json(
        { message: 'Placement not found' },
        { status: 404 }
      )
    }

    // Delete placement and update candidate status
    await prisma.$transaction(async (tx) => {
      await tx.placement.delete({
        where: { candidateId }
      })

      await tx.candidate.update({
        where: { id: candidateId },
        data: { status: 'ACTIVE' } // Reset to active
      })
    })

    // Notify original recruiter
    if (candidate.addedById !== session.user.id) {
      await prisma.notification.create({
        data: {
          title: 'Placement Removed',
          message: `Admin removed placement details for ${candidate.name}`,
          type: 'WARNING',
          receiverId: candidate.addedById,
          senderId: session.user.id
        }
      })
    }

    return NextResponse.json({
      message: 'Placement deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting placement:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}