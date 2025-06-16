// middleware.js (Fixed to prevent unnecessary reloads)
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth?.token;

    // Skip middleware for static files and API routes that don't need protection
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/auth') ||
      pathname.includes('.') ||
      pathname === '/favicon.ico'
    ) {
      return NextResponse.next()
    }

    // Handle post-job route FIRST
    if (pathname.startsWith('/post-job')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      
      if (token.role === 'EMPLOYER') {
        return NextResponse.next()
      }
      
      if (token.role === 'RECRUITER') {
        const recruiterProfile = token.recruiterProfile
        if (recruiterProfile?.isActive) {
          return NextResponse.next()
        }
        return NextResponse.redirect(new URL('/auth/recruiter-approval', req.url))
      }
      
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Handle dashboard routes
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      if (!token.role) {
        return NextResponse.redirect(new URL('/auth/role-selection', req.url))
      }

      // Check recruiter access for recruiter routes
      if (pathname.startsWith('/dashboard/recruiter')) {
        if (token.role !== 'RECRUITER') {
          const redirectUrl = token.role === 'EMPLOYEE' ? '/dashboard/employee' : '/dashboard/employer'
          return NextResponse.redirect(new URL(redirectUrl, req.url))
        }
        
        const recruiterProfile = token.recruiterProfile
        if (!recruiterProfile?.isActive) {
          return NextResponse.redirect(new URL('/auth/recruiter-approval', req.url))
        }
      }

      // Check role access for other dashboards
      if (pathname.startsWith('/dashboard/employee') && token.role !== 'EMPLOYEE') {
        const redirectUrl = token.role === 'EMPLOYER' ? '/dashboard/employer' : '/dashboard/recruiter'
        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }

      if (pathname.startsWith('/dashboard/employer') && token.role !== 'EMPLOYER') {
        const redirectUrl = token.role === 'EMPLOYEE' ? '/dashboard/employee' : '/dashboard/recruiter'
        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }

      return NextResponse.next()
    }

    // Handle recruiter API routes
    if (pathname.startsWith('/api/recruiter')) {
      if (!token || token.role !== 'RECRUITER') {
        return NextResponse.json(
          { message: 'Access denied. Recruiter role required.' },
          { status: 403 }
        )
      }

      const recruiterProfile = token.recruiterProfile
      if (!recruiterProfile?.isActive) {
        return NextResponse.json(
          { message: 'Recruiter access pending approval.' },
          { status: 403 }
        )
      }
      
      return NextResponse.next()
    }

    // Handle auth pages
    if (pathname.startsWith('/auth/')) {
      if (pathname === '/auth/login' && token) {
        if (!token.role) {
          return NextResponse.redirect(new URL('/auth/role-selection', req.url))
        }
        
        let dashboardUrl = '/dashboard/employee'
        if (token.role === 'EMPLOYER') {
          dashboardUrl = '/dashboard/employer'
        } else if (token.role === 'RECRUITER') {
          const recruiterProfile = token.recruiterProfile
          dashboardUrl = recruiterProfile?.isActive ? '/dashboard/recruiter' : '/auth/recruiter-approval'
        }
        
        return NextResponse.redirect(new URL(dashboardUrl, req.url))
      }

      if (pathname === '/auth/role-selection') {
        if (!token) {
          return NextResponse.redirect(new URL('/auth/login', req.url))
        }
        if (token.role) {
          let dashboardUrl = '/dashboard/employee'
          if (token.role === 'EMPLOYER') {
            dashboardUrl = '/dashboard/employer'
          } else if (token.role === 'RECRUITER') {
            const recruiterProfile = token.recruiterProfile
            dashboardUrl = recruiterProfile?.isActive ? '/dashboard/recruiter' : '/auth/recruiter-approval'
          }
          return NextResponse.redirect(new URL(dashboardUrl, req.url))
        }
      }

      if (pathname === '/auth/recruiter-approval') {
        if (!token) {
          return NextResponse.redirect(new URL('/auth/login', req.url))
        }
        
        if (token.role !== 'RECRUITER') {
          const dashboardUrl = token.role === 'EMPLOYER' ? '/dashboard/employer' : '/dashboard/employee'
          return NextResponse.redirect(new URL(dashboardUrl, req.url))
        }

        const recruiterProfile = token.recruiterProfile
        if (recruiterProfile?.isActive) {
          return NextResponse.redirect(new URL('/dashboard/recruiter', req.url))
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Always allow public routes and static files
        if (
          pathname === '/' ||
          pathname.startsWith('/jobs') ||
          pathname.startsWith('/contact') ||
          pathname.startsWith('/about') ||
          pathname.startsWith('/auth/') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/api/auth') ||
          pathname.includes('.') ||
          (pathname.includes('/api/jobs') && req.method === 'GET')
        ) {
          return true
        }

        // Require authentication for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)',
  ],
}