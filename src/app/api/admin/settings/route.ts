import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const SETTINGS_DIR = path.join(process.cwd(), '.admin')
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'settings.json')

interface AdminSettings {
  apiKey?: string
}

async function getSettings(): Promise<AdminSettings> {
  try {
    if (!existsSync(SETTINGS_FILE)) {
      return {}
    }
    const data = await readFile(SETTINGS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

async function saveSettings(settings: AdminSettings): Promise<void> {
  if (!existsSync(SETTINGS_DIR)) {
    await mkdir(SETTINGS_DIR, { recursive: true })
  }
  await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

export async function GET(request: NextRequest) {
  try {
    // Check if requesting the real API key (for imports)
    const { searchParams } = new URL(request.url)
    const getRealKey = searchParams.get('real') === 'true'
    
    const settings = await getSettings()
    
    // If requesting real key, verify admin access
    if (getRealKey) {
      // Check for custom admin token first
      const adminToken = request.headers.get('x-admin-token')
      let isAdminAuthorized = false
      
      if (adminToken) {
        try {
          const decoded = JSON.parse(Buffer.from(adminToken, 'base64').toString())
          if (decoded.expiry && decoded.expiry > Date.now()) {
            isAdminAuthorized = true
          }
        } catch (error) {
          console.error('Invalid admin token:', error)
        }
      }
      
      // If no admin token, check NextAuth session
      if (!isAdminAuthorized) {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          )
        }

        const user = await prisma.user.findUnique({
          where: { email: session.user.email! }
        })

        if (!user || (user as any).role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          )
        }
      }

      // Return the real API key for admin
      return NextResponse.json({
        apiKey: settings.apiKey || '',
        hasApiKey: !!settings.apiKey
      })
    }
    
    // Otherwise, return masked API key
    const maskedSettings = {
      ...settings,
      apiKey: settings.apiKey 
        ? '•'.repeat(Math.max(0, settings.apiKey.length - 4)) + settings.apiKey.slice(-4)
        : undefined,
      hasApiKey: !!settings.apiKey
    }
    
    return NextResponse.json(maskedSettings)
  } catch (error) {
    console.error('Failed to get settings:', error)
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const currentSettings = await getSettings()
    
    const newSettings: AdminSettings = {
      ...currentSettings,
    }

    if (body.apiKey !== undefined) {
      // Only update if it's a new key (not masked)
      if (!body.apiKey.includes('•')) {
        newSettings.apiKey = body.apiKey
      }
    }

    await saveSettings(newSettings)

    return NextResponse.json({ success: true, message: 'Settings saved' })
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
