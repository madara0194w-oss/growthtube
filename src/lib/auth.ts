import { NextAuthOptions, getServerSession } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Email/Password Provider
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { channel: true },
        })

        if (!user || !user.password) {
          throw new Error('Invalid email or password')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error('Invalid email or password')
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error('Please verify your email before signing in. Check your inbox for the verification link.')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          username: user.username,
          image: user.avatar,
          channelId: user.channel?.id,
          channelHandle: user.channel?.handle,
        }
      },
    }),

    // Google OAuth Provider
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            async profile(profile) {
              // Generate unique username with retry logic
              let username = profile.email.split('@')[0]
              let attempt = 0
              const maxAttempts = 10
              
              while (attempt < maxAttempts) {
                const suffix = attempt === 0 ? '' : `_${Math.random().toString(36).slice(2, 7)}`
                const testUsername = username + suffix
                
                const existing = await prisma.user.findUnique({
                  where: { username: testUsername.toLowerCase() },
                })
                
                if (!existing) {
                  username = testUsername
                  break
                }
                attempt++
              }
              
              // Fallback to UUID if still colliding
              if (attempt >= maxAttempts) {
                username = `user_${profile.sub.slice(-8)}`
              }
              
              return {
                id: profile.sub,
                email: profile.email,
                name: profile.name,
                image: profile.picture,
                username,
              }
            },
          }),
        ]
      : []),

    // GitHub OAuth Provider
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            async profile(profile) {
              // Generate unique username with retry logic
              let username = profile.login
              let attempt = 0
              const maxAttempts = 10
              
              while (attempt < maxAttempts) {
                const suffix = attempt === 0 ? '' : `_${Math.random().toString(36).slice(2, 7)}`
                const testUsername = username + suffix
                
                const existing = await prisma.user.findUnique({
                  where: { username: testUsername.toLowerCase() },
                })
                
                if (!existing) {
                  username = testUsername
                  break
                }
                attempt++
              }
              
              // Fallback to UUID if still colliding
              if (attempt >= maxAttempts) {
                username = `user_${profile.id.toString().slice(-8)}`
              }
              
              return {
                id: profile.id.toString(),
                email: profile.email,
                name: profile.name || profile.login,
                image: profile.avatar_url,
                username,
              }
            },
          }),
        ]
      : []),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/',
    error: '/',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth users, create a channel if they don't have one
      if (account?.provider !== 'credentials') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { channel: true },
        })

        if (existingUser && !existingUser.channel) {
          await prisma.channel.create({
            data: {
              userId: existingUser.id,
              handle: existingUser.username,
              name: existingUser.displayName,
              avatar: existingUser.avatar,
            },
          })
        }
      }
      return true
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
        token.channelId = (user as any).channelId
        token.channelHandle = (user as any).channelHandle
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.name = session.name
        token.image = session.image
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.channelId = token.channelId as string
        session.user.channelHandle = token.channelHandle as string
      }
      return session
    },
  },

  events: {
    async createUser({ user }) {
      // Create a channel for new users in a transaction
      const username = (user as any).username || user.email!.split('@')[0]
      
      try {
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: user.id },
            data: {
              username,
              displayName: user.name || username,
            },
          })

          await tx.channel.create({
            data: {
              userId: user.id,
              handle: username.toLowerCase(),
              name: user.name || username,
              avatar: user.image,
            },
          })
        })
      } catch (error) {
        console.error('Failed to create user channel:', error)
        // If channel creation fails, still allow user creation
        // User can create channel manually later
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
}

export async function getAuthSession() {
  return getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getAuthSession()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      channel: true,
    },
  })

  return user
}
