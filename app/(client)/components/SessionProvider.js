'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import useStore from '../store/authStore'

function AuthStateManager({ children }) {
  const { data: session, status } = useSession()
  const { initializeFromSession } = useStore()

  useEffect(() => {
    initializeFromSession(session)
  }, [session, initializeFromSession])

  return children
}

export default function AppSessionProvider({ children }) {
  return (
    <SessionProvider>
      <AuthStateManager>
        {children}
      </AuthStateManager>
    </SessionProvider>
  )
}