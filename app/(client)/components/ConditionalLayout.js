// app/(client)/components/ConditionalLayout.js (Optimized)
'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import MainLayout from './MainLayout'

// Define auth routes once to prevent recreation
const AUTH_ROUTES = new Set([
  '/auth/login',
  '/auth/register', 
  '/auth/role-selection',
  '/auth/recruiter-approval'
])

export default function ConditionalLayout({ children }) {
  const pathname = usePathname()
  
  // Memoize the route check to prevent unnecessary re-renders
  const isAuthRoute = useMemo(() => {
    return AUTH_ROUTES.has(pathname) || pathname.startsWith('/auth/')
  }, [pathname])
  
  // For auth routes, render children directly (they have their own layout)
  if (isAuthRoute) {
    return <>{children}</>
  }
  
  // For all other routes, use the main layout
  return (
    <MainLayout>
      {children}
    </MainLayout>
  )
}