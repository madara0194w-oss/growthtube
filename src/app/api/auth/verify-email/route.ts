import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getVerificationToken, deleteVerificationToken } from '@/lib/tokens'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Get the verification token
    const verificationToken = await getVerificationToken(token)

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (new Date() > verificationToken.expires) {
      await deleteVerificationToken(token)
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Update user's email verification status
    const user = await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    })

    // Delete the used token
    await deleteVerificationToken(token)

    return NextResponse.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email. Please try again.' },
      { status: 500 }
    )
  }
}
