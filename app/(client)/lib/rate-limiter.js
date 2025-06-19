// app/(client)/lib/rate-limiter.js
import { NextResponse } from 'next/server'

// In-memory rate limiting (for production, use Redis or database)
const attempts = new Map()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5 // Maximum attempts per window

export class RateLimiter {
  static getKey(ip, email = '') {
    return `${ip}:${email}`
  }

  static isRateLimited(key) {
    const now = Date.now()
    const userAttempts = attempts.get(key) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW }

    // Reset if window has passed
    if (now > userAttempts.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
      return false
    }

    // Check if exceeded limit
    if (userAttempts.count >= MAX_ATTEMPTS) {
      return {
        limited: true,
        resetTime: userAttempts.resetTime,
        attemptsLeft: 0
      }
    }

    // Increment attempts
    attempts.set(key, { ...userAttempts, count: userAttempts.count + 1 })
    
    return {
      limited: false,
      attemptsLeft: MAX_ATTEMPTS - userAttempts.count,
      resetTime: userAttempts.resetTime
    }
  }

  static reset(key) {
    attempts.delete(key)
  }

  static cleanup() {
    const now = Date.now()
    for (const [key, data] of attempts.entries()) {
      if (now > data.resetTime) {
        attempts.delete(key)
      }
    }
  }
}

// Middleware function for password reset endpoints
export function withRateLimit(handler, options = {}) {
  const { 
    maxAttempts = MAX_ATTEMPTS, 
    windowMs = RATE_LIMIT_WINDOW,
    keyGenerator = (req) => req.ip || 'anonymous'
  } = options

  return async (request, context) => {
    try {
      // Get client IP
      const forwarded = request.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'anonymous'
      
      // Get email from request body if available
      let email = ''
      try {
        const body = await request.clone().json()
        email = body.email || ''
      } catch (e) {
        // Ignore JSON parse errors
      }

      const key = keyGenerator ? keyGenerator(request) : RateLimiter.getKey(ip, email)
      const result = RateLimiter.isRateLimited(key)

      if (result.limited) {
        const resetTimeMinutes = Math.ceil((result.resetTime - Date.now()) / (1000 * 60))
        
        return NextResponse.json(
          { 
            message: `Too many attempts. Please try again in ${resetTimeMinutes} minutes.`,
            rateLimited: true,
            resetTimeMinutes
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': maxAttempts.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': result.resetTime.toString()
            }
          }
        )
      }

      // Continue to handler
      const response = await handler(request, context)
      
      // Add rate limit headers to successful responses
      if (response.status < 400) {
        response.headers.set('X-RateLimit-Limit', maxAttempts.toString())
        response.headers.set('X-RateLimit-Remaining', result.attemptsLeft.toString())
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
      }

      return response

    } catch (error) {
      console.error('Rate limiting error:', error)
      // If rate limiting fails, continue without it
      return handler(request, context)
    }
  }
}

// Cleanup expired entries periodically
setInterval(() => {
  RateLimiter.cleanup()
}, 5 * 60 * 1000) // Clean up every 5 minutes