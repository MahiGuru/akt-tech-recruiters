// app/(client)/lib/auth.js (Updated with Recruiter Profile)
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import LinkedInProvider from 'next-auth/providers/linkedin'
import { prisma } from './prisma'
import bcrypt from 'bcrypt'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            recruiterProfile: {
              include: {
                adminRecruiter: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password)
        
        if (!isValidPassword) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          recruiterProfile: user.recruiterProfile
        }
      }
    }),
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
          scope: 'openid profile email',
        },
      },
      issuer: 'https://www.linkedin.com',
      jwks_endpoint: 'https://www.linkedin.com/oauth/openid/jwks',
      async profile(profile, tokens) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'credentials') {
        return true
      }

      // Handle OAuth sign in
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: {
            recruiterProfile: {
              include: {
                adminRecruiter: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        })

        if (existingUser) {
          // Update existing user
          const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: user.name || existingUser.name,
              image: user.image || existingUser.image,
            },
            include: {
              recruiterProfile: {
                include: {
                  adminRecruiter: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          })
          
          user.id = updatedUser.id
          user.role = updatedUser.role
          user.recruiterProfile = updatedUser.recruiterProfile
        } else {
          // Create new user
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              role: 'EMPLOYEE' // Default role for OAuth users
            },
            include: {
              recruiterProfile: {
                include: {
                  adminRecruiter: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          })
          
          user.id = newUser.id
          user.role = newUser.role
          user.recruiterProfile = newUser.recruiterProfile
        }

        return true
      } catch (error) {
        console.error('OAuth sign in error:', error)
        return false
      }
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
        token.recruiterProfile = user.recruiterProfile
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        if (session.role) {
          token.role = session.role
        }
        if (session.recruiterProfile !== undefined) {
          token.recruiterProfile = session.recruiterProfile
        }
      }

      // Refresh recruiter profile data periodically
      if (token.role === 'RECRUITER' && token.id) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.id },
            include: {
              recruiterProfile: {
                include: {
                  adminRecruiter: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          })
          
          if (user) {
            token.role = user.role
            token.recruiterProfile = user.recruiterProfile
          }
        } catch (error) {
          console.error('Error refreshing recruiter profile:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.recruiterProfile = token.recruiterProfile
        
        // Add convenience flags
        if (token.recruiterProfile) {
          session.user.isActiveRecruiter = token.recruiterProfile.isActive
          session.user.isAdminRecruiter = token.recruiterProfile.recruiterType === 'ADMIN'
          session.user.recruiterType = token.recruiterProfile.recruiterType
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
  },
  debug: process.env.NODE_ENV === 'development',
}