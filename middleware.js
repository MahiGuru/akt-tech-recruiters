// middleware.js (Final Fixed version)
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth?.token;

    // IMPORTANT: Handle post-job route FIRST to prevent conflicts
    if (pathname.startsWith('/post-job')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      
      // Allow EMPLOYERS always
      if (token.role === 'EMPLOYER') {
        return NextResponse.next()
      }
      
      // Allow active RECRUITERS
      if (token.role === 'RECRUITER') {
        const recruiterProfile = token.recruiterProfile
        if (!recruiterProfile || !recruiterProfile.isActive) {
          return NextResponse.redirect(new URL('/auth/recruiter-approval', req.url))
        }
        return NextResponse.next()
      }
      
      // Deny access for EMPLOYEES or other roles
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Handle dashboard redirects (after post-job to avoid conflicts)
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      // If user doesn't have a role, redirect to role selection
      if (!token.role) {
        return NextResponse.redirect(new URL('/auth/role-selection', req.url))
      }

      // Special handling for recruiters - check if they have active access
      if (token.role === 'RECRUITER') {
        const recruiterProfile = token.recruiterProfile
        if (!recruiterProfile || !recruiterProfile.isActive) {
          if (pathname !== '/auth/recruiter-approval') {
            return NextResponse.redirect(new URL('/auth/recruiter-approval', req.url))
          }
        }
      }

      // Role-based dashboard access
      if (pathname.startsWith('/dashboard/employee') && token.role !== 'EMPLOYEE') {
        const redirectUrl = token.role === 'EMPLOYER' ? '/dashboard/employer' : '/dashboard/recruiter'
        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }

      if (pathname.startsWith('/dashboard/employer') && token.role !== 'EMPLOYER') {
        const redirectUrl = token.role === 'EMPLOYEE' ? '/dashboard/employee' : '/dashboard/recruiter'
        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }

      if (pathname.startsWith('/dashboard/recruiter') && token.role !== 'RECRUITER') {
        const redirectUrl = token.role === 'EMPLOYEE' ? '/dashboard/employee' : '/dashboard/employer'
        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }
    }

    // Handle recruiter-specific API routes
    if (pathname.startsWith('/api/recruiter')) {
      if (!token || token.role !== 'RECRUITER') {
        return NextResponse.json(
          { message: 'Access denied. Recruiter role required.' },
          { status: 403 }
        )
      }

      const recruiterProfile = token.recruiterProfile
      if (!recruiterProfile || !recruiterProfile.isActive) {
        return NextResponse.json(
          { message: 'Recruiter access pending approval.' },
          { status: 403 }
        )
      }
    }

    // Handle recruiter approval page access
    if (pathname === '/auth/recruiter-approval') {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      
      if (token.role !== 'RECRUITER') {
        let dashboardUrl = '/dashboard/employee'
        if (token.role === 'EMPLOYER') {
          dashboardUrl = '/dashboard/employer'
        }
        return NextResponse.redirect(new URL(dashboardUrl, req.url))
      }

      const recruiterProfile = token.recruiterProfile
      if (recruiterProfile && recruiterProfile.isActive) {
        return NextResponse.redirect(new URL('/dashboard/recruiter', req.url))
      }
    }

    // Redirect authenticated users away from auth pages
    if (token && pathname.startsWith('/auth/login')) {
      if (!token.role) {
        return NextResponse.redirect(new URL('/auth/role-selection', req.url))
      }
      
      if (token.role === 'RECRUITER') {
        const recruiterProfile = token.recruiterProfile
        if (!recruiterProfile || !recruiterProfile.isActive) {
          return NextResponse.redirect(new URL('/auth/recruiter-approval', req.url))
        }
        return NextResponse.redirect(new URL('/dashboard/recruiter', req.url))
      }
      
      let dashboardUrl = '/dashboard/employee'
      if (token.role === 'EMPLOYER') {
        dashboardUrl = '/dashboard/employer'
      }
      
      return NextResponse.redirect(new URL(dashboardUrl, req.url))
    }

    // Allow access to role selection only for authenticated users without roles
    if (pathname === '/auth/role-selection') {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      if (token.role) {
        if (token.role === 'RECRUITER') {
          const recruiterProfile = token.recruiterProfile
          if (!recruiterProfile || !recruiterProfile.isActive) {
            return NextResponse.redirect(new URL('/auth/recruiter-approval', req.url))
          }
          return NextResponse.redirect(new URL('/dashboard/recruiter', req.url))
        }
        
        let dashboardUrl = '/dashboard/employee'
        if (token.role === 'EMPLOYER') {
          dashboardUrl = '/dashboard/employer'
        }
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
          pathname.startsWith('/auth/register') ||
          pathname.startsWith('/auth/recruiter-approval') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon') ||
          (pathname.includes('/api/jobs') && req.method === 'GET') // Public job listings
        ) {
          return true
        }

        // Require authentication for protected routes
        if (
          pathname.startsWith('/dashboard') ||
          pathname.startsWith('/post-job') ||
          pathname === '/auth/role-selection' ||
          pathname.startsWith('/api/recruiter')
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