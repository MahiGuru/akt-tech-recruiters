// app/(client)/components/NotificationService.js
'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  UserPlus,
  Clock
} from 'lucide-react'

const NotificationService = () => {
  const { data: session } = useSession()
  const intervalRef = useRef(null)
  const lastNotificationCheck = useRef(Date.now())

  useEffect(() => {
    if (!session?.user || session.user.role !== 'RECRUITER') {
      return
    }

    // Start polling for notifications
    startNotificationPolling()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [session])

  const startNotificationPolling = () => {
    // Check immediately
    checkForNewNotifications()

    // Then check every 30 seconds
    intervalRef.current = setInterval(() => {
      checkForNewNotifications()
    }, 30000)
  }

  const checkForNewNotifications = async () => {
    try {
      const response = await fetch('/api/recruiter/notifications?isRead=false&limit=10')
      if (!response.ok) return

      const data = await response.json()
      const notifications = data.notifications || []

      // Filter notifications that came after our last check
      const newNotifications = notifications.filter(notification => 
        new Date(notification.createdAt) > new Date(lastNotificationCheck.current)
      )

      // Show toast notifications for new items
      newNotifications.forEach(notification => {
        showNotificationToast(notification)
      })

      // Update last check time
      lastNotificationCheck.current = Date.now()

    } catch (error) {
      console.error('Error checking notifications:', error)
    }
  }

  const showNotificationToast = (notification) => {
    const getIcon = () => {
      switch (notification.type) {
        case 'SUCCESS':
          return <CheckCircle className="w-5 h-5 text-green-600" />
        case 'WARNING':
          return <AlertCircle className="w-5 h-5 text-yellow-600" />
        case 'ERROR':
          return <AlertCircle className="w-5 h-5 text-red-600" />
        case 'APPROVAL_REQUEST':
          return <UserPlus className="w-5 h-5 text-blue-600" />
        case 'INTERVIEW_REMINDER':
          return <Clock className="w-5 h-5 text-purple-600" />
        default:
          return <Info className="w-5 h-5 text-blue-600" />
      }
    }

    const getToastType = () => {
      switch (notification.type) {
        case 'SUCCESS':
          return 'success'
        case 'ERROR':
          return 'error'
        case 'WARNING':
          return 'error' // Use error style for warnings to get attention
        default:
          return 'custom'
      }
    }

    if (notification.type === 'APPROVAL_REQUEST') {
      // Special handling for approval requests - admin only
      if (session?.user?.recruiterProfile?.recruiterType === 'ADMIN') {
        toast.custom((t) => (
          <div className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  toast.dismiss(t.id)
                  // Could add navigation to approval page here
                  window.location.href = '/dashboard/recruiter?tab=dashboard'
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Review
              </button>
            </div>
          </div>
        ), {
          duration: 8000,
          position: 'top-right'
        })
      }
    } else {
      // Regular notifications
      toast(
        <div className="flex items-center">
          {getIcon()}
          <div className="ml-3">
            <p className="text-sm font-medium">{notification.title}</p>
            <p className="text-xs text-gray-500">{notification.message}</p>
          </div>
        </div>,
        {
          type: getToastType(),
          duration: 5000,
          position: 'top-right'
        }
      )
    }

    // Play notification sound for important notifications
    if (['APPROVAL_REQUEST', 'SUCCESS', 'WARNING', 'ERROR'].includes(notification.type)) {
      playNotificationSound()
    }
  }

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {
        // Ignore errors - user might not have interacted with page yet
      })
    } catch (error) {
      // Ignore audio errors
    }
  }

  // This component doesn't render anything visible
  return null
}

export default NotificationService