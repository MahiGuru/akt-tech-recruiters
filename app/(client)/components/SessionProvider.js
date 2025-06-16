// app/(client)/components/SessionProvider.js (Optimized)
'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect, useRef } from 'react'

export default function AppSessionProvider({ children, session }) {
  const hasInitialized = useRef(false)
  
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) return
    hasInitialized.current = true
    
    // Disable automatic session refresh on window focus
    // This prevents unnecessary session checks when switching tabs
    if (typeof window !== 'undefined') {
      window.__NEXT_AUTH = {
        ...window.__NEXT_AUTH,
        _getSession: () => null // Disable automatic session fetching
      }
    }
  }, [])

  return (
    <SessionProvider
      session={session}
      // Reduce session refresh frequency
      refetchInterval={5 * 60} // 5 minutes instead of default 5 seconds
      refetchOnWindowFocus={false} // Don't refetch on tab focus
      refetchWhenOffline={false} // Don't refetch when coming back online
    >
      {children}
    </SessionProvider>
  )
}