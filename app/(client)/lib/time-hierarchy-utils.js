// app/(client)/lib/time-hierarchy-utils.js
// Utility functions for time management hierarchy and escalation

import { prisma } from './prisma'

/**
 * Find available manager up the hierarchy for time entry approval
 * Walks up the hierarchy until it finds an active admin manager
 * @param {string} userId - The user ID to find manager for
 * @returns {Promise<Object|null>} Manager info or null if none found
 */
export async function findAvailableManager(userId) {
  let currentUserId = userId
  let level = 0
  const maxLevels = 5 // Prevent infinite loops

  while (level < maxLevels) {
    const userProfile = await prisma.recruiter.findUnique({
      where: { userId: currentUserId },
      include: {
        adminRecruiter: {
          select: {
            id: true,
            name: true,
            email: true,
            recruiterProfile: {
              select: {
                isActive: true,
                recruiterType: true,
                adminId: true
              }
            }
          }
        }
      }
    })

    if (!userProfile?.adminId) {
      // Reached top of hierarchy
      break
    }

    // Check if the admin is available
    const adminProfile = await prisma.recruiter.findUnique({
      where: { userId: userProfile.adminId },
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

    if (adminProfile?.isActive && adminProfile.recruiterType === 'ADMIN') {
      return {
        managerId: userProfile.adminId,
        managerName: adminProfile.user.name,
        level: level + 1,
        escalated: level > 0
      }
    }

    // Manager not available, go up one level
    currentUserId = userProfile.adminId
    level++
  }

  return null // No available manager found
}

/**
 * Check if a user can approve time entries for another user
 * Handles both direct reports and escalated approvals
 * @param {string} approverId - The manager user ID
 * @param {string} submitterId - The team member user ID
 * @returns {Promise<{canApprove: boolean, isEscalated: boolean, level: number}>}
 */
export async function canApproveTimeEntry(approverId, submitterId) {
  // Check if direct manager
  const submitterProfile = await prisma.recruiter.findUnique({
    where: { userId: submitterId },
    select: { adminId: true }
  })

  const isDirectManager = submitterProfile?.adminId === approverId

  if (isDirectManager) {
    return { canApprove: true, isEscalated: false, level: 1 }
  }

  // Check if escalated to this manager
  const availableManager = await findAvailableManager(submitterId)
  const isEscalatedToManager = availableManager && 
                              availableManager.managerId === approverId && 
                              availableManager.escalated

  return {
    canApprove: isEscalatedToManager,
    isEscalated: isEscalatedToManager,
    level: availableManager?.level || 0
  }
}

/**
 * Get all users whose time entries should be visible to a manager
 * Includes direct reports and escalated entries
 * @param {string} managerId - The manager user ID
 * @returns {Promise<{directReports: string[], escalatedUsers: string[]}>}
 */
export async function getManagerTimeEntryUsers(managerId) {
  // Get direct reports
  const directReports = await prisma.recruiter.findMany({
    where: { 
      adminId: managerId, 
      isActive: true 
    },
    select: { userId: true }
  })

  const directReportIds = directReports.map(r => r.userId)

  // Get escalated entries - users where this manager is the available manager
  const allActiveUsers = await prisma.recruiter.findMany({
    where: { isActive: true },
    select: { userId: true }
  })

  const escalatedUserIds = []
  
  // Check which users would escalate to this manager
  for (const user of allActiveUsers) {
    if (!directReportIds.includes(user.userId)) { // Not a direct report
      const availableManager = await findAvailableManager(user.userId)
      if (availableManager && availableManager.managerId === managerId && availableManager.escalated) {
        escalatedUserIds.push(user.userId)
      }
    }
  }

  return {
    directReports: directReportIds,
    escalatedUsers: escalatedUserIds
  }
}

/**
 * Create escalation notification for time entry
 * @param {string} submitterId - The team member who submitted
 * @param {string} submitterName - The team member's name
 * @param {Object} availableManager - Manager info from findAvailableManager
 * @param {Object} entryData - Time entry data (hours, date, etc.)
 * @param {boolean} isBulk - Whether this is a bulk submission
 * @returns {Promise<void>}
 */
export async function createEscalationNotification(submitterId, submitterName, availableManager, entryData, isBulk = false) {
  if (!availableManager) return

  const notificationTitle = availableManager.escalated 
    ? `Escalated ${isBulk ? 'Bulk ' : ''}Time Entr${isBulk ? 'ies' : 'y'} for Approval (Level ${availableManager.level})`
    : `New ${isBulk ? 'Bulk ' : ''}Time Entr${isBulk ? 'ies' : 'y'} for Approval`
    
  let notificationMessage
  if (isBulk) {
    notificationMessage = availableManager.escalated
      ? `${submitterName} submitted ${entryData.count} time entries totaling ${entryData.totalHours} hours. Escalated to you because immediate manager is unavailable.`
      : `${submitterName} submitted ${entryData.count} time entries totaling ${entryData.totalHours} hours`
  } else {
    notificationMessage = availableManager.escalated
      ? `${submitterName} submitted ${entryData.hours} hours for ${entryData.date}. Escalated to you because immediate manager is unavailable.`
      : `${submitterName} submitted ${entryData.hours} hours for ${entryData.date}`
  }

  await prisma.notification.create({
    data: {
      title: notificationTitle,
      message: notificationMessage,
      type: 'APPROVAL_REQUEST',
      receiverId: availableManager.managerId,
      senderId: submitterId
    }
  })
}

/**
 * Mark time entries as escalated in the database
 * @param {string[]} entryIds - Array of time entry IDs
 * @param {string} originalDescription - Original description to append to
 * @returns {Promise<void>}
 */
export async function markEntriesAsEscalated(entryIds, originalDescription = '') {
  await prisma.timeEntry.updateMany({
    where: {
      id: { in: entryIds }
    },
    data: {
      description: originalDescription 
        ? `${originalDescription} [ESCALATED]`
        : '[ESCALATED]'
    }
  })
}