import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth?.token

    // Handle role-based redirects
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      // If user doesn't have a role, redirect to role selection
      if (!token.role) {
        return NextResponse.redirect(new URL('/auth/role-selection', req.url))
      }

      // Role-based dashboard access
      if (pathname.startsWith('/dashboard/employee') && token.role !== 'EMPLOYEE') {
        return NextResponse.redirect(new URL('/dashboard/employer', req.url))
      }

      if (pathname.startsWith('/dashboard/employer') && token.role !== 'EMPLOYER') {
        return NextResponse.redirect(new URL('/dashboard/employee', req.url))
      }
    }

    // Redirect authenticated users away from auth pages
    if (token && pathname.startsWith('/auth/login')) {
      if (!token.role) {
        return NextResponse.redirect(new URL('/auth/role-selection', req.url))
      }
      
      const dashboardUrl = token.role === 'EMPLOYER' 
        ? '/dashboard/employer' 
        : '/dashboard/employee'
      return NextResponse.redirect(new URL(dashboardUrl, req.url))
    }

    // Allow access to role selection only for authenticated users without roles
    if (pathname === '/auth/role-selection') {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      if (token.role) {
        const dashboardUrl = token.role === 'EMPLOYER' 
          ? '/dashboard/employer' 
          : '/dashboard/employee'
        return NextResponse.redirect(new URL(dashboardUrl, req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to public routes
        if (
          pathname === '/' ||
          pathname.startsWith('/jobs') ||
          pathname.startsWith('/auth/login') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon') ||
          pathname.includes('/api/jobs') && req.method === 'GET' // Public job listings
        ) {
          return true
        }

        // Require authentication for protected routes
        if (
          pathname.startsWith('/dashboard') ||
          pathname.startsWith('/post-job') ||
          pathname === '/auth/role-selection'
        ) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (logo, etc.)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|logo.svg|next.svg|vercel.svg|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}