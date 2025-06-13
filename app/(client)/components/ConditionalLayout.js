'use client'

import { usePathname } from 'next/navigation'
import MainLayout from './MainLayout'

export default function ConditionalLayout({ children }) {
  const pathname = usePathname()
  
  // Routes that should NOT use the main layout (auth pages)
  const authRoutes = [
    '/auth/login',
    '/auth/register', 
    '/auth/role-selection'
  ]
  
  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
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