import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// This endpoint is for development/testing only
// It manually verifies a user's email without needing to click the email link
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find and update user
    const user = await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    })

    return NextResponse.json({
      message: 'Email verified successfully (manual)',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    })
  } catch (error) {
    console.error('Manual verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email. User may not exist.' },
      { status: 500 }
    )
  }
}
