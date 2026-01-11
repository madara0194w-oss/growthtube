import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'growthtube2026'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      )
    }

    if (password === ADMIN_PASSWORD) {
      // Generate a simple token for session validation
      const token = crypto.randomBytes(32).toString('hex')
      const expiry = Date.now() + 60 * 60 * 1000 // 1 hour

      // In production, you'd want to store this in a database or Redis
      // For now, we'll encode it in the token itself
      const tokenData = Buffer.from(JSON.stringify({ token, expiry })).toString('base64')

      return NextResponse.json({
        success: true,
        token: tokenData,
        message: 'Access granted'
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Admin verify error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
