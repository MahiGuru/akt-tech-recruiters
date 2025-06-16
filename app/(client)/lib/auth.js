// app/(client)/lib/auth.js (Optimized)
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcrypt"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            recruiterProfile: true
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          recruiterProfile: user.recruiterProfile
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour - only update session every hour
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Only update token when necessary
      if (user) {
        token.role = user.role
        token.recruiterProfile = user.recruiterProfile
      }

      // Handle session updates without excessive database queries
      if (trigger === "update" && session) {
        if (session.role !== undefined) {
          token.role = session.role
        }
        if (session.recruiterProfile !== undefined) {
          token.recruiterProfile = session.recruiterProfile
        }
      }

      // Cache recruiter profile to prevent excessive DB queries
      if (token.role === 'RECRUITER' && !token.recruiterProfile) {
        try {
          const recruiterProfile = await prisma.recruiter.findUnique({
            where: { userId: token.sub }
          })
          token.recruiterProfile = recruiterProfile
        } catch (error) {
          console.error('Error fetching recruiter profile:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.recruiterProfile = token.recruiterProfile
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Handle Google OAuth user creation/update
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          })

          if (!existingUser) {
            // Create new user from Google OAuth
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
                role: 'EMPLOYEE' // Default role
              }
            })
            user.id = newUser.id
            user.role = newUser.role
          } else {
            user.id = existingUser.id
            user.role = existingUser.role
            
            // Get recruiter profile if exists
            if (existingUser.role === 'RECRUITER') {
              const recruiterProfile = await prisma.recruiter.findUnique({
                where: { userId: existingUser.id }
              })
              user.recruiterProfile = recruiterProfile
            }
          }
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }
      return true
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  
  // Optimize session handling
  events: {
    async signIn(message) {
      // Log sign in events but don't perform expensive operations
      if (process.env.NODE_ENV === 'development') {
        console.log('User signed in:', message.user.email)
      }
    }
  }
}