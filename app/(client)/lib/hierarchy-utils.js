// app/(client)/lib/hierarchy-utils.js
// Utility functions for consistent team hierarchy management across all APIs

import { prisma } from './prisma'

/**
 * Recursively get all team member IDs under an admin
 * This includes the admin themselves and all nested sub-team members
 * @param {string} adminId - The admin user ID
 * @returns {Promise<string[]>} Array of user IDs in the hierarchy
 */
export async function getAllTeamUserIds(adminId) {
  const visited = new Set()
  const toVisit = [adminId]

  while (toVisit.length > 0) {
    const currentAdminId = toVisit.pop()

    if (!visited.has(currentAdminId)) {
      visited.add(currentAdminId)

      // Get all direct reports for this admin
      const team = await prisma.recruiter.findMany({
        where: { 
          adminId: currentAdminId, 
          isActive: true 
        },
        select: { userId: true }
      })

      // Add each team member to the queue for processing
      team.forEach(member => {
        if (!visited.has(member.userId)) {
          toVisit.push(member.userId)
        }
      })
    }
  }

  return Array.from(visited)
}

/**
 * Get only direct reports (non-recursive)
 * @param {string} adminId - The admin user ID
 * @returns {Promise<string[]>} Array of direct report user IDs
 */
export async function getDirectReportIds(adminId) {
  const directReports = await prisma.recruiter.findMany({
    where: {
      OR: [
        { adminId: adminId }, // Direct team members
        { userId: adminId, recruiterType: 'ADMIN' } // Include admin themselves
      ],
      isActive: true
    },
    select: { userId: true }
  })
  
  return directReports.map(member => member.userId)
}

/**
 * Check if a user can manage another user based on hierarchy
 * @param {string} managerId - The manager user ID
 * @param {string} targetUserId - The target user ID to check
 * @returns {Promise<boolean>} True if manager can manage target
 */
export async function canManageUser(managerId, targetUserId) {
  if (managerId === targetUserId) return true
  
  const managerProfile = await prisma.recruiter.findUnique({
    where: { userId: managerId }
  })
  
  if (!managerProfile || managerProfile.recruiterType !== 'ADMIN') {
    return false
  }
  
  const teamUserIds = await getAllTeamUserIds(managerId)
  return teamUserIds.includes(targetUserId)
}

/**
 * Get allowed recruiter IDs for a user based on their role and hierarchy
 * @param {string} userId - The user ID
 * @returns {Promise<{ids: string[], isAdmin: boolean, hierarchyLevel: number}>}
 */
export async function getAllowedRecruiterIds(userId) {
  const recruiterProfile = await prisma.recruiter.findUnique({
    where: { userId }
  })

  if (!recruiterProfile || !recruiterProfile.isActive) {
    return { ids: [userId], isAdmin: false, hierarchyLevel: 0 }
  }

  const isAdmin = recruiterProfile.recruiterType === 'ADMIN'
  
  if (isAdmin) {
    const teamIds = await getAllTeamUserIds(userId)
    
    // Calculate hierarchy level (0 = main admin, 1 = sub-admin, etc.)
    const hierarchyLevel = recruiterProfile.adminId ? 1 : 0
    
    return { 
      ids: teamIds, 
      isAdmin: true, 
      hierarchyLevel,
      totalTeamSize: teamIds.length
    }
  }

  return { 
    ids: [userId], 
    isAdmin: false, 
    hierarchyLevel: 0,
    totalTeamSize: 1
  }
}

/**
 * Validate that all candidate IDs are accessible by the given user
 * @param {string[]} candidateIds - Array of candidate IDs to check
 * @param {string} userId - The user ID checking access
 * @returns {Promise<{accessible: string[], denied: string[]}>}
 */
export async function validateCandidateAccess(candidateIds, userId) {
  const { ids: allowedRecruiterIds } = await getAllowedRecruiterIds(userId)
  
  const accessibleCandidates = await prisma.candidate.findMany({
    where: {
      id: { in: candidateIds },
      addedById: { in: allowedRecruiterIds }
    },
    select: { id: true }
  })
  
  const accessibleIds = accessibleCandidates.map(c => c.id)
  const deniedIds = candidateIds.filter(id => !accessibleIds.includes(id))
  
  return {
    accessible: accessibleIds,
    denied: deniedIds
  }
}

/**
 * Get team hierarchy structure for an admin
 * @param {string} adminId - The admin user ID
 * @param {number} maxDepth - Maximum depth to traverse (default: 10)
 * @returns {Promise<Object[]>} Hierarchical team structure
 */
export async function getTeamHierarchy(adminId, maxDepth = 10) {
  if (maxDepth <= 0) return []
  
  const directReports = await prisma.recruiter.findMany({
    where: {
      adminId: adminId,
      isActive: true
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
    orderBy: [
      { recruiterType: 'asc' },
      { user: { name: 'asc' } }
    ]
  })

  const hierarchy = await Promise.all(
    directReports.map(async (member) => {
      const subordinates = member.recruiterType === 'ADMIN' 
        ? await getTeamHierarchy(member.userId, maxDepth - 1)
        : []

      return {
        id: member.id,
        userId: member.userId,
        recruiterType: member.recruiterType,
        department: member.department,
        isActive: member.isActive,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        user: member.user,
        subordinates,
        subordinateCount: subordinates.length,
        totalTeamSize: subordinates.reduce((sum, sub) => sum + (sub.totalTeamSize || 0), 0) + subordinates.length
      }
    })
  )

  return hierarchy
}

/**
 * Check if user is main admin (top-level admin with no adminId)
 * @param {string} userId - The user ID to check
 * @returns {Promise<boolean>} True if user is main admin
 */
export async function isMainAdmin(userId) {
  const recruiter = await prisma.recruiter.findUnique({
    where: { userId }
  })
  
  return recruiter?.recruiterType === 'ADMIN' && !recruiter.adminId
}

/**
 * Get hierarchy depth for a user
 * @param {string} userId - The user ID
 * @returns {Promise<number>} Hierarchy depth (0 = main admin, 1 = sub-admin, etc.)
 */
export async function getHierarchyDepth(userId) {
  const recruiter = await prisma.recruiter.findUnique({
    where: { userId }
  })
  
  if (!recruiter) return 0
  
  if (!recruiter.adminId) return 0 // Main admin
  
  // Recursively find depth
  let depth = 1
  let currentAdminId = recruiter.adminId
  
  while (currentAdminId && depth < 10) { // Prevent infinite loops
    const adminRecruiter = await prisma.recruiter.findUnique({
      where: { userId: currentAdminId }
    })
    
    if (!adminRecruiter || !adminRecruiter.adminId) break
    
    currentAdminId = adminRecruiter.adminId
    depth++
  }
  
  return depth
}

/**
 * Create debug information for hierarchy operations
 * @param {string} userId - The user ID
 * @param {string} operation - The operation being performed
 * @returns {Promise<Object>} Debug information
 */
export async function getHierarchyDebugInfo(userId, operation) {
  const recruiterProfile = await prisma.recruiter.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, email: true } }
    }
  })
  
  if (!recruiterProfile) {
    return {
      operation,
      userId,
      error: 'No recruiter profile found'
    }
  }
  
  const { ids: allowedIds, isAdmin, hierarchyLevel, totalTeamSize } = await getAllowedRecruiterIds(userId)
  const mainAdmin = await isMainAdmin(userId)
  
  return {
    operation,
    user: {
      id: userId,
      name: recruiterProfile.user.name,
      email: recruiterProfile.user.email,
      recruiterType: recruiterProfile.recruiterType
    },
    hierarchy: {
      isAdmin,
      isMainAdmin: mainAdmin,
      level: hierarchyLevel,
      teamSize: totalTeamSize,
      allowedRecruiterIds: allowedIds.length,
      canManageDeepHierarchy: isAdmin
    },
    timestamp: new Date().toISOString()
  }
}