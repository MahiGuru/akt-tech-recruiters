import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import LinkedInProvider from "next-auth/providers/linkedin"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Social Providers
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
      issuer: "https://www.linkedin.com",
      jwks_endpoint: "https://www.linkedin.com/oauth/openid_configuration",
      profile(profile, tokens) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    }),
    // Credentials Provider for email/password
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        try {
          // Find user in database with recruiter profile
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              role: true,
              image: true,
              phone: true,
              location: true,
              experience: true,
              skills: true,
              resumeUrl: true,
              bio: true,
              createdAt: true,
              recruiterProfile: {
                select: {
                  id: true,
                  recruiterType: true,
                  department: true,
                  isActive: true,
                  adminId: true
                }
              }
            },
          })

          if (!user || !user.password) {
            throw new Error("Invalid email or password")
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isPasswordValid) {
            throw new Error("Invalid email or password")
          }

          // Return user object (password excluded)
          const { password, ...userWithoutPassword } = user
          return userWithoutPassword

        } catch (error) {
          console.error("Auth error:", error)
          throw new Error("Authentication failed")
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.provider = account?.provider || 'credentials'
        
        // Add recruiter profile info to token
        if (user.role === 'RECRUITER' && user.recruiterProfile) {
          token.recruiterProfile = user.recruiterProfile
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.provider = token.provider
        
        // Add recruiter profile to session
        if (token.recruiterProfile) {
          session.user.recruiterProfile = token.recruiterProfile
        }
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Handle social login
      if (account?.provider && account.provider !== 'credentials') {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { recruiterProfile: true }
          })
          
          // If user doesn't exist, we'll create them with default role
          // The role selection will happen on the dashboard
          if (!existingUser) {
            // This will be handled by the adapter, but we can add custom logic here
            return true
          }
          
          return true
        } catch (error) {
          console.error("Error during social sign in:", error)
          return false
        }
      }
      
      // Handle credentials login
      if (account?.provider === 'credentials') {
        return true
      }
      
      return true
    },
  },
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/role-selection', // Redirect new social users to role selection
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}